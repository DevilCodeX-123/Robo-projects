import { dataService } from '../services/dataService.js';

export const getComponents = async (req, res) => {
  try {
    const { category, search, includeArchived } = req.query;
    const components = await dataService.getComponents({
      category,
      search,
      includeArchived: includeArchived === 'true'
    });
    res.json({ success: true, count: components.length, components });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComponentById = async (req, res) => {
  try {
    const component = await dataService.getComponentById(req.params.id);
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }
    res.json({ success: true, component });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createComponent = async (req, res) => {
  try {
    const {
      name,
      label,
      category,
      description,
      whatItDoes,
      imageUrl,
      datasheetUrl,
      rack,
      shelf,
      shelfIndex,
      box,
      room,
      totalStock,
      availableStock,
      minThreshold,
      unit,
      purchasePrice,
      supplier,
      isConsumable,
      technicalSpecs
    } = req.body;

    if (!name || !category || totalStock === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category, and total stock are required' });
    }

    const rackVal = rack || 'A';
    const shelfVal = Number(shelfIndex || shelf) || 1;
    const boxVal = box ? String(box).padStart(2, '0') : '01';
    const coordinates = `(${rackVal},${shelfVal},${boxVal})`;

    const count = (await dataService.getComponents()).length + 1;
    const componentCode = `CMP-${category.substring(0, 3).toUpperCase()}-${String(count).padStart(3, '0')}`;
    const totalNum = Number(totalStock);
    const availNum = availableStock !== undefined ? Number(availableStock) : totalNum;

    const newComponent = await dataService.createComponent({
      componentCode,
      name,
      label: label || name,
      category,
      whatItDoes: whatItDoes || description || '',
      description: description || whatItDoes || '',
      shelfIndex: shelfVal,
      imageUrl: imageUrl || '',
      datasheetUrl: datasheetUrl || '',
      location: {
        rack: rackVal,
        shelf: shelfVal,
        box: boxVal,
        coordinates,
        room: room || 'Robotics Lab 304'
      },
      totalStock: totalNum,
      availableStock: availNum,
      reservedStock: 0,
      issuedStock: 0,
      damagedStock: 0,
      minThreshold: Number(minThreshold) || 5,
      unit: unit || 'pcs',
      purchasePrice: Number(purchasePrice) || 0,
      supplier: supplier || 'RoboStock Warehouse',
      isConsumable: Boolean(isConsumable),
      technicalSpecs: technicalSpecs || {},
      status: 'ACTIVE'
    });

    // Record initial receipt transaction
    await dataService.recordTransaction({
      component: newComponent._id || newComponent.id,
      componentName: newComponent.name,
      componentCode: newComponent.componentCode,
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'Inventory Manager',
      type: 'RECEIPT',
      quantityChange: totalNum,
      resultingStock: {
        available: availNum,
        reserved: 0,
        issued: 0,
        damaged: 0
      },
      reason: 'Initial stock intake'
    });

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      userRole: req.user?.role || 'ADMIN',
      action: 'COMPONENT_CREATED',
      entityType: 'COMPONENT',
      entityId: String(newComponent._id || newComponent.id),
      details: { name: newComponent.name, category, totalStock: totalNum }
    });

    res.status(201).json({ success: true, component: newComponent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const current = await dataService.getComponentById(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    if (updateData.totalStock !== undefined) updateData.totalStock = Number(updateData.totalStock);
    if (updateData.availableStock !== undefined) updateData.availableStock = Number(updateData.availableStock);
    if (updateData.minThreshold !== undefined) updateData.minThreshold = Number(updateData.minThreshold);
    if (updateData.shelfIndex !== undefined) updateData.shelfIndex = Number(updateData.shelfIndex);
    if (updateData.whatItDoes && !updateData.description) updateData.description = updateData.whatItDoes;

    if (updateData.rack || updateData.shelf || updateData.shelfIndex || updateData.box) {
      const rack = updateData.rack || current.location?.rack || 'A';
      const shelf = Number(updateData.shelfIndex || updateData.shelf || current.location?.shelf || 1);
      const box = updateData.box || current.location?.box || '01';
      updateData.shelfIndex = shelf;
      updateData.location = {
        rack,
        shelf,
        box: String(box).padStart(2, '0'),
        coordinates: `(${rack},${shelf},${String(box).padStart(2, '0')})`,
        room: updateData.room || current.location?.room || 'Robotics Lab 304'
      };
    }

    const updated = await dataService.updateComponent(id, updateData);

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      userRole: req.user?.role || 'ADMIN',
      action: 'COMPONENT_UPDATED',
      entityType: 'COMPONENT',
      entityId: String(id),
      details: { name: updated.name, availableStock: updated.availableStock }
    });

    res.json({ success: true, component: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkCreateComponents = async (req, res) => {
  try {
    const { components } = req.body;
    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a non-empty array of components' });
    }

    const existingCount = (await dataService.getComponents({ includeArchived: true })).length;
    const created = [];

    for (let i = 0; i < components.length; i++) {
      const item = components[i];
      if (!item.name || !item.name.trim()) continue;

      const category = (item.category || 'Basic Electronics').trim();
      const shelfVal = Number(item.shelfIndex || item.shelf) || 1;
      const totalNum = Math.max(0, Number(item.totalStock ?? item.availableStock ?? 0));
      const availNum = Math.max(0, Number(item.availableStock ?? totalNum));
      const componentCode = `CMP-${category.substring(0, 3).toUpperCase()}-${String(existingCount + i + 1).padStart(3, '0')}`;

      const comp = await dataService.createComponent({
        componentCode,
        name: item.name.trim(),
        label: (item.label || item.name).trim(),
        category,
        whatItDoes: item.whatItDoes || item.description || `${item.name.trim()} laboratory component.`,
        description: item.description || item.whatItDoes || `${item.name.trim()} laboratory component.`,
        shelfIndex: shelfVal,
        imageUrl: item.imageUrl || '',
        location: {
          rack: 'A',
          shelf: shelfVal,
          box: String(i + 1).padStart(2, '0'),
          coordinates: `(A,${shelfVal},${String(i + 1).padStart(2, '0')})`,
          room: 'Robotics Lab 304'
        },
        totalStock: totalNum,
        availableStock: availNum,
        reservedStock: 0,
        issuedStock: 0,
        damagedStock: 0,
        minThreshold: Number(item.minThreshold) || 5,
        unit: item.unit || 'pcs',
        status: 'ACTIVE'
      });

      created.push(comp);
    }

    if (created.length > 0) {
      await dataService.recordAuditLog({
        user: req.user?._id || req.user?.id,
        userName: req.user?.fullName || 'Administrator',
        userRole: req.user?.role || 'ADMIN',
        action: 'COMPONENTS_BULK_CREATED',
        entityType: 'COMPONENT',
        entityId: 'BULK',
        details: { count: created.length }
      });
    }

    res.status(201).json({ success: true, count: created.length, components: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dataService.updateComponent(id, { status: 'ACTIVE' });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      userRole: req.user?.role || 'ADMIN',
      action: 'COMPONENT_RESTORED',
      entityType: 'COMPONENT',
      entityId: String(id),
      details: { name: updated.name }
    });

    res.json({ success: true, component: updated, message: 'Component restored to active inventory' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const isPermanent = req.query.permanent === 'true';

    if (isPermanent) {
      const removed = await dataService.deleteComponentPermanently(id);
      if (!removed) {
        return res.status(404).json({ success: false, message: 'Component not found' });
      }
      await dataService.recordAuditLog({
        user: req.user?._id || req.user?.id,
        userName: req.user?.fullName || 'Administrator',
        userRole: req.user?.role || 'ADMIN',
        action: 'COMPONENT_DELETED_PERMANENT',
        entityType: 'COMPONENT',
        entityId: String(id),
        details: { name: removed.name }
      });
      return res.json({ success: true, message: 'Component permanently deleted' });
    }

    const updated = await dataService.updateComponent(id, { status: 'ARCHIVED' });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    await dataService.recordAuditLog({
      user: req.user?._id || req.user?.id,
      userName: req.user?.fullName || 'Administrator',
      userRole: req.user?.role || 'ADMIN',
      action: 'COMPONENT_ARCHIVED',
      entityType: 'COMPONENT',
      entityId: String(id),
      details: { name: updated.name }
    });

    res.json({ success: true, message: 'Component archived successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
