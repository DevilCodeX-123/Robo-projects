import { dataService } from '../services/dataService.js';

export const createRequest = async (req, res) => {
  try {
    const { items, studentName, projectName, projectPurpose, seniorApproverId, seniorContact, expectedPickupDate, expectedReturnDate, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one component to request' });
    }

    if (!projectName || !projectPurpose) {
      return res.status(400).json({ success: false, message: 'Project name and purpose are required' });
    }

    const allComponents = await dataService.getComponents();

    // Validate availability for each requested component
    const preparedItems = [];
    for (const item of items) {
      let comp = item.componentId ? await dataService.getComponentById(item.componentId) : null;

      if (!comp) {
        const searchHint = (item.matchedDbName || item.componentName || '').trim().toLowerCase();
        const rawName = (item.componentName || '').trim().toLowerCase();
        if (searchHint || rawName) {
          comp = allComponents.find(c => {
            const dbName = (c.name || '').toLowerCase();
            return (
              dbName === rawName ||
              dbName === searchHint ||
              (searchHint && dbName.includes(searchHint)) ||
              (rawName && dbName.length > 2 && rawName.includes(dbName))
            );
          });
        }
      }

      if (!comp) {
        return res.status(400).json({
          success: false,
          message: `Component "${item.componentName || item.componentId}" not found in database`
        });
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${comp.name}` });
      }

      if (qty > comp.availableStock) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${comp.name}. Requested: ${qty}, Available: ${comp.availableStock}` 
        });
      }

      preparedItems.push({
        component: comp._id || comp.id,
        componentName: comp.name,
        componentCode: comp.componentCode,
        requestedQuantity: qty,
        approvedQuantity: 0,
        issuedQuantity: 0,
        returnedQuantity: 0,
        itemStatus: 'PENDING'
      });
    }

    // Generate Request Code
    const count = (await dataService.getRequests()).length + 1;
    const requestCode = `REQ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    // Senior Approver details (look up registered Senior first, then fallback to User)
    let registeredSenior = null;
    let seniorUser = null;
    if (seniorApproverId) {
      registeredSenior = await dataService.getSeniorById(seniorApproverId);
      if (!registeredSenior) {
        seniorUser = await dataService.findUserById(seniorApproverId);
      }
    }
    if (!registeredSenior && !seniorUser) {
      const registeredList = await dataService.getSeniors();
      if (registeredList.length > 0) {
        registeredSenior = registeredList[0];
      } else {
        const allUsers = await dataService.getUsers();
        seniorUser = allUsers.find(u => u.role === 'SENIOR' || u.role === 'ADMIN');
      }
    }

    const assignedSeniorId = registeredSenior?._id || registeredSenior?.id || seniorUser?._id || seniorUser?.id;
    const assignedSeniorName = registeredSenior?.fullName || seniorUser?.fullName || req.body.seniorApproverName || 'Senior Approver';
    const assignedSeniorPhone = seniorContact || registeredSenior?.phoneNumber || seniorUser?.contactNumber || '';
    const assignedSeniorDept = registeredSenior?.department || seniorUser?.department || '';
    const assignedSeniorPos = registeredSenior?.position || 'Senior Approver';

    const requesterName = (studentName && studentName.trim()) || req.user.fullName;

    const newRequest = await dataService.createRequest({
      requestCode,
      user: req.user._id || req.user.id,
      userName: requesterName,
      userEmail: req.user.email,
      projectName,
      projectPurpose,
      seniorContact: assignedSeniorPhone,
      seniorApprover: assignedSeniorId,
      seniorApproverName: assignedSeniorName,
      seniorDepartment: assignedSeniorDept,
      seniorPosition: assignedSeniorPos,
      items: preparedItems,
      status: 'SUBMITTED',
      expectedPickupDate: expectedPickupDate || new Date(Date.now() + 86400000).toISOString(),
      expectedReturnDate: expectedReturnDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: notes || '',
      approvalHistory: []
    });

    // Notify the senior approver (routes to Senior Portal & assigned senior)
    await dataService.createNotification({
      user: registeredSenior?.linkedUserId || seniorUser?._id || seniorUser?.id || assignedSeniorId,
      userRole: 'SENIOR',
      title: `New Component Request for ${assignedSeniorName}`,
      message: `${requesterName} requested ${preparedItems.map(i => i.componentName).join(', ')} (${requestCode}).`,
      link: `/approvals?id=${newRequest._id || newRequest.id}`,
      type: 'INFO'
    });

    // Audit log
    await dataService.recordAuditLog({
      user: req.user._id || req.user.id,
      userName: req.user.fullName,
      userRole: req.user.role,
      action: 'REQUEST_SUBMITTED',
      entityType: 'REQUEST',
      entityId: String(newRequest._id || newRequest.id),
      details: { requestCode, itemsCount: preparedItems.length }
    });

    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    // If student/member, only return their own requests
    const normalizedRole = String(req.user.role || '').toUpperCase();
    if (normalizedRole === 'MEMBER' || normalizedRole === 'STUDENT') {
      filter.user = req.user._id || req.user.id;
    }

    const requests = await dataService.getRequests(filter);
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  try {
    const request = await dataService.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Role security: students/members can only view their own requests
    const normalizedRole = String(req.user.role || '').toUpperCase();
    if ((normalizedRole === 'MEMBER' || normalizedRole === 'STUDENT') && String(request.user) !== String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this request' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments, adjustedQuantities } = req.body;

    if (!['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'REQUESTED_INFO'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid review action' });
    }

    const request = await dataService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only authorized Seniors and Administrators have permission to approve or reject permission requests
    const reviewerRole = String(req.user.role || '').toUpperCase();
    if (!['SENIOR', 'ADMIN'].includes(reviewerRole)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only authorized Seniors and Administrators have permission to review or approve requests.'
      });
    }

    // Prevent members from approving their own requests
    if (String(request.user) === String(req.user._id || req.user.id)) {
      return res.status(403).json({ success: false, message: 'You cannot approve your own request' });
    }

    const approvalRecord = {
      approver: req.user._id || req.user.id,
      approverName: req.user.fullName,
      action,
      comments: comments || (action === 'APPROVED' ? 'Approved by senior reviewer' : 'Reviewed'),
      timestamp: new Date().toISOString()
    };

    const history = Array.isArray(request.approvalHistory) ? [...request.approvalHistory, approvalRecord] : [approvalRecord];

    if (action === 'APPROVED' || action === 'PARTIALLY_APPROVED') {
      // Process stock reservations
      for (let i = 0; i < request.items.length; i++) {
        const item = request.items[i];
        const comp = await dataService.getComponentById(item.component);

        let approvedQty = item.requestedQuantity;
        if (action === 'PARTIALLY_APPROVED' && adjustedQuantities && adjustedQuantities[item.component] !== undefined) {
          approvedQty = Number(adjustedQuantities[item.component]);
        }

        if (approvedQty > comp.availableStock) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve ${comp.name}. Requested: ${approvedQty}, Available: ${comp.availableStock}`
          });
        }

        // Atomically reserve stock
        await dataService.adjustComponentStock(item.component, {
          deltaAvailable: -approvedQty,
          deltaReserved: approvedQty
        });

        // Record reservation ledger
        const updatedComp = await dataService.getComponentById(item.component);
        await dataService.recordTransaction({
          component: item.component,
          componentName: comp.name,
          componentCode: comp.componentCode,
          user: req.user._id || req.user.id,
          userName: req.user.fullName,
          type: 'RESERVATION',
          quantityChange: approvedQty,
          resultingStock: {
            available: updatedComp.availableStock,
            reserved: updatedComp.reservedStock,
            issued: updatedComp.issuedStock,
            damaged: updatedComp.damagedStock
          },
          requestId: request._id || request.id,
          requestCode: request.requestCode,
          reason: `Reserved for request ${request.requestCode}`
        });

        request.items[i].approvedQuantity = approvedQty;
        request.items[i].itemStatus = approvedQty > 0 ? 'APPROVED' : 'REJECTED';
      }

      request.status = 'READY_FOR_PICKUP';

      // Notify requesting student
      await dataService.createNotification({
        user: request.user,
        title: action === 'APPROVED' ? 'Request Approved — Ready for Pickup!' : 'Request Partially Approved',
        message: `Your request ${request.requestCode} has been authorized. Please visit the lab to collect your components.`,
        link: `/my-requests?id=${request._id || request.id}`,
        type: 'SUCCESS'
      });

      // Notify inventory manager that items are ready to be physically handed over
      await dataService.createNotification({
        userRole: 'INVENTORY_MANAGER',
        title: 'New Approved Request Ready for Issuance',
        message: `${request.requestCode} for ${request.userName} is ready for physical checkout.`,
        link: `/inventory?tab=issuance`,
        type: 'INFO'
      });

    } else if (action === 'REJECTED') {
      request.status = 'REJECTED';
      request.items = request.items.map(item => ({ ...item, itemStatus: 'REJECTED' }));

      await dataService.createNotification({
        user: request.user,
        title: 'Request Rejected',
        message: `Your request ${request.requestCode} was rejected. Note: ${comments || 'No remarks provided.'}`,
        link: `/my-requests?id=${request._id || request.id}`,
        type: 'DANGER'
      });

    } else if (action === 'REQUESTED_INFO') {
      request.status = 'AWAITING_INFO';

      await dataService.createNotification({
        user: request.user,
        title: 'Additional Information Requested',
        message: `Senior reviewer requested more details on ${request.requestCode}: "${comments}"`,
        link: `/my-requests?id=${request._id || request.id}`,
        type: 'WARNING'
      });
    }

    const updated = await dataService.updateRequest(id, {
      status: request.status,
      items: request.items,
      approvalHistory: history
    });

    res.json({ success: true, request: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await dataService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (String(request.user) !== String(req.user._id || req.user.id) && String(req.user.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(request.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel request in '${request.status}' state. Contact inventory manager.` 
      });
    }

    const updated = await dataService.updateRequest(id, { status: 'CANCELLED' });
    res.json({ success: true, message: 'Request cancelled successfully', request: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
