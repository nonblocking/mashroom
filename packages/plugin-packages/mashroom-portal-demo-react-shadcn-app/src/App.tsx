import React from 'react';
import { toast } from 'sonner';
import ShadcnLogo from './assets/shadcn-ui-logo.svg';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';

export default () => {
    return (
        <div className='p-4'>
            <h4>
                React Shadcn Demo App <Badge variant="secondary">New</Badge>
            </h4>
            <div className="flex gap-4 py-2">
                <Card className="w-[18rem]">
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <div>
                            <img alt="Shadcn" src={ShadcnLogo} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div>
                            This Demo Microfrontend uses <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">Shadcn</a> components.
                            <br/>
                            It does not deliver a Tailwind theme itself, that should be provided by the Portal Theme.
                        </div>
                        <Button variant="default" className="my-2">Go somewhere</Button>
                    </CardContent>
                </Card>

                <Card className="w-[18rem]">
                    <CardHeader>
                        <CardTitle> Second Card Header</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <Skeleton className="bg-gray-300 dark:bg-gray-800 h-5 w-50" />
                            <Skeleton className="bg-gray-300 dark:bg-gray-800 h-5 w-50" />
                            <Skeleton className="bg-gray-300 dark:bg-gray-800 h-5 w-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="py-3">
                <Progress value={33} />
            </div>
            <div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>First Name</TableHead>
                            <TableHead>Last Name</TableHead>
                            <TableHead>Username</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell>Mark</TableCell>
                            <TableCell>Otto</TableCell>
                            <TableCell>@mdo</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>2</TableCell>
                            <TableCell>Jacob</TableCell>
                            <TableCell>Thornton</TableCell>
                            <TableCell>@fat</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>3</TableCell>
                            <TableCell colSpan={2}>Larry the Bird</TableCell>
                            <TableCell>@twitter</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <div className="flex gap-4 pt-2">
                <Button variant="default" onClick={() => toast.info('Woohoo, you\'re reading this text in a Toast!')}>Open Toast</Button>
                <Button variant="secondary">Secondary Button</Button>
            </div>
            <Toaster style={{
                '--normal-bg': 'var(--color-popover)',
                '--normal-text': 'var(--color-popover-foreground)',
                '--normal-border': 'var(--color-border)',
                '--border-radius': 'var(--radius-md)',
            } as any}/>
        </div>
    );
};
