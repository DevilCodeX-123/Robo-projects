import { dataService } from '../services/dataService.js';

export const getMaintenanceTickets = async (req, res) => {
  try {
    const tickets = await dataService.getMaintenanceTickets();
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMaintenanceTicket = async (req, res) => {
  try {
    const { componentId, faultDescription, severity, assignedToId } = req.body;
    if (!componentId || !faultDescription) {
      return res.status(400).json({ success: false, message: 'Component ID and fault description are required' });
    }

    const comp = await dataService.getComponentById(componentId);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    let assignedUser = null;
    if (assignedToId) {
      assignedUser = await dataService.findUserById(assignedToId);
    }

    const count = (await dataService.getMaintenanceTickets()).length + 1;
    const ticketCode = `MNT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newTicket = await dataService.createMaintenanceTicket({
      ticketCode,
      component: comp._id || comp.id,
      componentName: comp.name,
      componentCode: comp.componentCode,
      reportedBy: req.user._id || req.user.id,
      reportedByName: req.user.fullName,
      assignedTo: assignedUser?._id || assignedUser?.id,
      assignedToName: assignedUser?.fullName || 'Unassigned Technician',
      severity: severity || 'MEDIUM',
      status: 'OPEN',
      faultDescription,
      repairNotes: '',
      repairCost: 0
    });

    res.status(201).json({ success: true, ticket: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaintenanceTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.status === 'RESOLVED') {
      updateData.resolvedAt = new Date().toISOString();
    }

    const updated = await dataService.updateMaintenanceTicket(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, ticket: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
