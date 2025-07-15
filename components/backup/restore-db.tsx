'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function RestoreDatabase() {
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast({
                title: 'Missing File',
                description: 'Please select a database file before proceeding.',
            });
            return;
        }
        setIsConfirmOpen(true);
    };

    const handleRestore = async () => {
        setIsConfirmOpen(false);

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.set('file', file);

                const res = await fetch('/api/backup/restore-db', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    throw new Error(await res.text());
                }

                toast({
                    title: 'Database Restored',
                    description: 'The database has been successfully replaced.',
                });

                // Reset states and input
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                router.refresh();
            } catch (err) {
                toast({
                    title: 'Restore Failed',
                    description: err instanceof Error ? err.message : 'An unknown error occurred.',
                });
            }
        });
    };

    return (
        <div className="">
            <div className="border-2 rounded-lg shadow p-8">
                <h1 className="text-2xl font-bold mb-6">Restore Database</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="db-file">Database Backup File</Label>
                        <Input
                            id="db-file"
                            type="file"
                            accept=".db,.sqlite,.sqlite3"
                            ref={fileInputRef}
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            required
                        />
                        {file && (
                            <p className="text-sm text-muted-foreground">
                                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <Button
                            type="submit"
                            disabled={!file || isPending}
                            variant="destructive"
                            className="w-full"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                'Restore Database'
                            )}
                        </Button>
                    </div>

                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            This will completely replace your current database. Make sure you have a backup before proceeding.
                        </AlertDescription>
                    </Alert>
                </form>
            </div>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Database Replacement</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to replace the current database? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRestore}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                'Confirm Restore'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
