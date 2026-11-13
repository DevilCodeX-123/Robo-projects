import { dataService } from '../services/dataService.js';

export const issueRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await dataService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'READY_FOR_PICKUP' && request.status !== 'APPROVED') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot issue request in status '${request.status}'. It must be approved and ready for pickup.` 
      });
    }

    // Process physical issuance
    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];
      const qty = item.approvedQuantity || item.requestedQuantity;

      // Transfer from reserved to issued
      await dataService.adjustComponentStock(item.component, {
        deltaReserved: -qty,
        deltaIssued: qty
      });

      const comp = await dataService.getComponentById(item.component);

      // Record transaction
      await dataService.recordTransaction({
        component: item.component,
        componentName: comp.name,
        componentCode: comp.componentCode,
        user: req.user._id || req.user.id,
        userName: req.user.fullName,
        type: 'ISSUANCE',
        quantityChange: qty,
        resultingStock: {
          available: comp.availableStock,
          reserved: comp.reservedStock,
          issued: comp.issuedStock,
          damaged: comp.damagedStock
        },
        requestId: request._id || request.id,
        requestCode: request.requestCode,
        reason: `Physical issuance to ${request.userName} by ${req.user.fullName}`
      });

      request.items[i].issuedQuantity = qty;
      request.items[i].itemStatus = 'ISSUED';
    }

    const updated = await dataService.updateRequest(id, {
      status: 'ISSUED',
      items: request.items,
      actualPickupDate: new Date().toISOString()
    });

    // Notify student
    await dataService.createNotification({
      user: request.user,
      title: 'Components Issued Successfully',
      message: `Your requested components for ${request.projectName} have been checked out. Expected return: ${new Date(request.expectedReturnDate).toLocaleDateString()}.`,
      link: `/my-requests?id=${request._id || request.id}`,
      type: 'INFO'
    });

    res.json({ success: true, message: 'Components successfully issued', request: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnItems } = req.body || {};
    // returnItems: [{ componentId, returnedQuantity, condition: 'GOOD'|'DAMAGED', notes }]

    const request = await dataService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Allow staff (SENIOR, INVENTORY_MANAGER, ADMIN) OR the requesting student returning their own issued items
    const isStaff = ['SENIOR', 'INVENTORY_MANAGER', 'ADMIN'].includes(req.user.role);
    const isOwner = String(request.user) === String(req.user._id || req.user.id);
    if (!isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to return items for this request' });
    }

    if (request.status !== 'ISSUED' && request.status !== 'PARTIALLY_RETURNED' && request.status !== 'OVERDUE') {
      return res.status(400).json({ success: false, message: `Cannot return items for request in '${request.status}' status` });
    }

    // Default to returning all remaining items in GOOD condition if returnItems array is omitted
    const itemsToReturn = Array.isArray(returnItems) && returnItems.length > 0
      ? returnItems
      : request.items.map(it => ({
          componentId: it.component,
          returnedQuantity: Math.max(0, (it.issuedQuantity || it.approvedQuantity || it.requestedQuantity) - (it.returnedQuantity || 0)),
          condition: 'GOOD',
          notes: `Returned by ${req.user.fullName}`
        }));

    const updatedComponents = [];

    for (const ret of itemsToReturn) {
      const itemIdx = request.items.findIndex(it => String(it.component) === String(ret.componentId));
      if (itemIdx === -1) continue;

      const targetItem = request.items[itemIdx];
      const issuedTotal = targetItem.issuedQuantity || targetItem.approvedQuantity || targetItem.requestedQuantity || 0;
      const alreadyReturned = targetItem.returnedQuantity || 0;
      const remaining = Math.max(0, issuedTotal - alreadyReturned);

      const requestedQty = Number(ret.returnedQuantity) || 0;
      const qty = Math.min(requestedQty, remaining);
      if (qty <= 0) continue;

      const comp = await dataService.getComponentById(ret.componentId);
      if (!comp) continue;

      const isDamaged = ret.condition === 'DAMAGED';

      if (isDamaged) {
        // Transfer from issued to damaged
        await dataService.adjustComponentStock(ret.componentId, {
          deltaIssued: -qty,
          deltaDamaged: qty
        });

        // Automatically create a maintenance ticket for inspection
        const ticketCode = `MNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
        await dataService.createMaintenanceTicket({
          ticketCode,
          component: comp._id || comp.id,
          componentName: comp.name,
          componentCode: comp.componentCode,
          reportedBy: req.user._id || req.user.id,
          reportedByName: req.user.fullName,
          severity: 'HIGH',
          status: 'OPEN',
          faultDescription: `Returned damaged from request ${request.requestCode}: ${ret.notes || 'Component malfunction detected during check-in inspection.'}`,
          repairCost: 0
        });

        // Record damage transaction
        const updatedComp = await dataService.getComponentById(ret.componentId);
        updatedComponents.push({
          id: updatedComp._id || updatedComp.id,
          name: updatedComp.name,
          availableStock: updatedComp.availableStock,
          issuedStock: updatedComp.issuedStock,
          damagedStock: updatedComp.damagedStock
        });

        await dataService.recordTransaction({
          component: comp._id || comp.id,
          componentName: comp.name,
          componentCode: comp.componentCode,
          user: req.user._id || req.user.id,
          userName: req.user.fullName,
          type: 'DAMAGE',
          quantityChange: qty,
          resultingStock: {
            available: updatedComp.availableStock,
            reserved: updatedComp.reservedStock,
            issued: updatedComp.issuedStock,
            damaged: updatedComp.damagedStock
          },
          requestId: request._id || request.id,
          requestCode: request.requestCode,
          reason: `Returned damaged: ${ret.notes || 'Damage on check-in'}`
        });

      } else {
        // Transfer from issued back to available stock (auto-restock)
        await dataService.adjustComponentStock(ret.componentId, {
          deltaIssued: -qty,
          deltaAvailable: qty
        });

        const updatedComp = await dataService.getComponentById(ret.componentId);
        updatedComponents.push({
          id: updatedComp._id || updatedComp.id,
          name: updatedComp.name,
          availableStock: updatedComp.availableStock,
          issuedStock: updatedComp.issuedStock,
          damagedStock: updatedComp.damagedStock
        });

        await dataService.recordTransaction({
          component: comp._id || comp.id,
          componentName: comp.name,
          componentCode: comp.componentCode,
          user: req.user._id || req.user.id,
          userName: req.user.fullName,
          type: 'RETURN',
          quantityChange: qty,
          resultingStock: {
            available: updatedComp.availableStock,
            reserved: updatedComp.reservedStock,
            issued: updatedComp.issuedStock,
            damaged: updatedComp.damagedStock
          },
          requestId: request._id || request.id,
          requestCode: request.requestCode,
          reason: `Returned in good condition: ${ret.notes || 'Checked in OK'}`
        });
      }

      request.items[itemIdx].returnedQuantity = alreadyReturned + qty;
      if (request.items[itemIdx].returnedQuantity >= issuedTotal) {
        request.items[itemIdx].itemStatus = 'RETURNED';
      }
    }

    // Check if all items are fully returned
    const allReturned = request.items.every(
      it => (it.returnedQuantity || 0) >= (it.issuedQuantity || it.approvedQuantity || it.requestedQuantity || 0)
    );
    const newStatus = allReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

    const updated = await dataService.updateRequest(id, {
      status: newStatus,
      items: request.items,
      actualReturnDate: allReturned ? new Date().toISOString() : undefined
    });

    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'COMPONENT_RETURNED',
      entityType: 'REQUEST',
      entityId: String(request._id || request.id),
      details: { requestCode: request.requestCode, status: newStatus, updatedComponents }
    });

    // Notify member and senior/inventory staff
    await dataService.createNotification({
      user: request.user,
      title: allReturned ? 'Request Return Completed' : 'Partial Return Processed',
      message: `Your return for ${request.requestCode} has been checked into the laboratory inventory and stock updated.`,
      link: `/my-requests?id=${request._id || request.id}`,
      type: 'SUCCESS'
    });

    res.json({
      success: true,
      message: 'Components returned and inventory stock updated automatically!',
      request: updated,
      updatedComponents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { componentId, deltaAvailable, reason } = req.body;

    if (!componentId || deltaAvailable === undefined || !reason) {
      return res.status(400).json({ success: false, message: 'Component ID, delta quantity, and mandatory reason are required' });
    }

    const comp = await dataService.getComponentById(componentId);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    const delta = Number(deltaAvailable);
    if (comp.availableStock + delta < 0) {
      return res.status(400).json({ success: false, message: 'Adjustment would result in negative available stock' });
    }

    await dataService.adjustComponentStock(componentId, { deltaAvailable: delta });
    const updatedComp = await dataService.getComponentById(componentId);

    // Record adjustment in ledger
    const tx = await dataService.recordTransaction({
      component: comp._id || comp.id,
      componentName: comp.name,
      componentCode: comp.componentCode,
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      type: 'ADJUSTMENT',
      quantityChange: delta,
      resultingStock: {
        available: updatedComp.availableStock,
        reserved: updatedComp.reservedStock,
        issued: updatedComp.issuedStock,
        damaged: updatedComp.damagedStock
      },
      reason
    });

    res.json({ success: true, component: updatedComp, transaction: tx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const transactions = await dataService.getTransactions(limit);
    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportCSV = async (req, res) => {
  try {
    const components = await dataService.getComponents();
    let csv = 'Component Code,Name,Category,Available Stock,Reserved Stock,Issued Stock,Damaged Stock,Total Stock,Coordinates,Rack,Shelf,Box,Price,Supplier\n';
    for (const c of components) {
      csv += `"${c.componentCode}","${c.name}","${c.category}",${c.availableStock},${c.reservedStock || 0},${c.issuedStock || 0},${c.damagedStock || 0},${c.totalStock},"${c.location?.coordinates || ''}","${c.location?.rack || ''}",${c.location?.shelf || ''},"${c.location?.box || ''}",${c.purchasePrice || 0},"${c.supplier || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="robotics_club_inventory.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
