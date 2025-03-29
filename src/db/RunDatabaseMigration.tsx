import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Code } from '../components/ui/code';
import sqlMigration from './create_user_sessions_table.sql?raw';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function RunDatabaseMigration() {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const runMigration = async () => {
        setStatus('running');
        setError(null);

        try {
            // Run the migration SQL script
            const { error } = await supabase.rpc('exec_sql', { sql: sqlMigration });

            if (error) throw error;

            setStatus('success');
        } catch (err: unknown) {
            console.error('Migration error:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to run migration');
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Database Migration Tool</CardTitle>
                <CardDescription>
                    Run the migration script to create the user_sessions table
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-muted">
                        <h3 className="font-semibold mb-2">Migration SQL</h3>
                        <Code className="text-xs overflow-auto max-h-64">
                            {sqlMigration}
                        </Code>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-destructive">
                            <h3 className="font-semibold mb-1">Error</h3>
                            <p>{error}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="p-4 border border-green-500/50 bg-green-500/10 rounded-md text-green-600">
                            <h3 className="font-semibold mb-1">Success</h3>
                            <p>The migration was executed successfully.</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={runMigration}
                    disabled={status === 'running'}
                    variant={status === 'success' ? "outline" : "default"}
                >
                    {status === 'running' ? 'Running...' :
                        status === 'success' ? 'Migration Complete' :
                            'Run Migration'}
                </Button>
            </CardFooter>
        </Card>
    );
} 