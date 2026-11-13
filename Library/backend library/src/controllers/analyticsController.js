import { dataService } from '../services/dataService.js';

export const getAnalytics = async (req, res) => {
  try {
    const components = await dataService.getComponents();
    const requests = await dataService.getRequests();
    const maintenance = await dataService.getMaintenanceTickets();
    const projects = await dataService.getProjects();
    const users = await dataService.getUsers();

    // 1. Stock Overview
    const totalComponentTypes = components.length;
    let totalStockUnits = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let issuedUnits = 0;
    let damagedUnits = 0;
    let totalValuation = 0;

    const categoryMap = {};

    for (const c of components) {
      const tot = c.totalStock || 0;
      const avail = c.availableStock || 0;
      const resv = c.reservedStock || 0;
      const iss = c.issuedStock || 0;
      const dam = c.damagedStock || 0;
      const price = c.purchasePrice || 0;

      totalStockUnits += tot;
      availableUnits += avail;
      reservedUnits += resv;
      issuedUnits += iss;
      damagedUnits += dam;
      totalValuation += tot * price;

      const cat = c.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + tot;
    }

    // 2. Request Statuses
    const now = new Date();
    let pendingRequests = 0;
    let readyPickupRequests = 0;
    let issuedRequests = 0;
    let returnedRequests = 0;
    let overdueRequests = 0;
    let rejectedRequests = 0;

    const componentRequestCounts = {};

    for (const r of requests) {
      if (['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_INFO'].includes(r.status)) {
        pendingRequests++;
      } else if (r.status === 'READY_FOR_PICKUP') {
        readyPickupRequests++;
      } else if (r.status === 'ISSUED') {
        issuedRequests++;
        if (r.expectedReturnDate && new Date(r.expectedReturnDate) < now) {
          overdueRequests++;
        }
      } else if (r.status === 'RETURNED') {
        returnedRequests++;
      } else if (r.status === 'REJECTED') {
        rejectedRequests++;
      }

      // Count component frequencies
      if (Array.isArray(r.items)) {
        for (const item of r.items) {
          const name = item.componentName || 'Unknown';
          componentRequestCounts[name] = (componentRequestCounts[name] || 0) + (item.requestedQuantity || 1);
        }
      }
    }

    // Top 5 requested components
    const topComponents = Object.entries(componentRequestCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Category distribution for charts
    const categoryDistribution = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      value: count
    }));

    // Stock Status Breakdown for Pie Chart
    const stockDistribution = [
      { name: 'Available', value: availableUnits, color: '#10B981' },
      { name: 'Reserved', value: reservedUnits, color: '#F59E0B' },
      { name: 'Issued', value: issuedUnits, color: '#3B82F6' },
      { name: 'Damaged', value: damagedUnits, color: '#EF4444' }
    ];

    // Low stock alerts
    const lowStockAlerts = components.filter(c => c.availableStock <= (c.minThreshold || 5)).map(c => ({
      id: c._id || c.id,
      name: c.name,
      code: c.componentCode,
      available: c.availableStock,
      threshold: c.minThreshold || 5,
      coordinates: c.location?.coordinates
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalComponentTypes,
          totalStockUnits,
          availableUnits,
          reservedUnits,
          issuedUnits,
          damagedUnits,
          totalValuation,
          totalProjects: projects.length,
          totalMembers: users.length,
          openMaintenanceTickets: maintenance.filter(m => m.status !== 'RESOLVED').length
        },
        requestsSummary: {
          total: requests.length,
          pending: pendingRequests,
          readyForPickup: readyPickupRequests,
          issued: issuedRequests,
          returned: returnedRequests,
          overdue: overdueRequests,
          rejected: rejectedRequests
        },
        stockDistribution,
        categoryDistribution,
        topComponents,
        lowStockAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
