import type { ReactNode } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from './AppSidebar'
import { ModeToggle } from '@/components/mode-toggle'

interface AppLayoutProps {
    children: ReactNode
    title?: string
    description?: string
    headerRight?: ReactNode
}

export function AppLayout({ children, title, description, headerRight }: AppLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex flex-1 items-start flex-col gap-0.5">
                        {title && <h1 className="text-sm font-semibold leading-none">{title}</h1>}
                        {description && <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {headerRight}
                        <ModeToggle />
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
