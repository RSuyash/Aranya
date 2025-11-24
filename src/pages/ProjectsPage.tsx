import React from 'react';
import { TreeForm } from '../components/forms/TreeForm';

export const ProjectsPage: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-text-main">Data Entry Demo</h2>
                <p className="text-text-muted">Test the field data collection wizard.</p>
            </div>

            <TreeForm />
        </div>
    );
};
