import React from 'react';
import TaskAnalytics from './TaskAnalytics';
import ProductivityTrends from './ProductivityTrends';

const AnalyticsDashboard: React.FC = () => {
    return (
        <div className="space-y-4">
            <TaskAnalytics />
            <ProductivityTrends />
        </div>
    );
};

export default AnalyticsDashboard; 