import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    MessageSquare,
    BookOpen,
    LogOut,
    BrainCircuit,
    GraduationCap,
    GitBranch,
    Upload,
    Settings,
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'

const studentNav = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Skill Tree', url: '/skill-tree', icon: GitBranch },
    { title: 'AI Tutor', url: '/tutor', icon: MessageSquare },
    { title: 'Courses', url: '/courses', icon: BookOpen },
]

const facultyNav = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Manage Courses', url: '/courses', icon: BookOpen },
    { title: 'Knowledge Base', url: '/resources', icon: Upload },
    { title: 'Student Insights', url: '/insights', icon: GraduationCap },
    { title: 'Settings', url: '/settings', icon: Settings },
]

export function AppSidebar() {
    const { profile, signOut } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const nav = profile?.role === 'faculty' ? facultyNav : studentNav
    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U'

    async function handleSignOut() {
        await signOut()
        navigate('/')
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg brand-gradient">
                        <BrainCircuit className="size-4 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight brand-gradient-text group-data-[collapsible=icon]:hidden">
                        Cogniva
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {nav.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            item.url === '/skill-tree'
                                                ? location.pathname.startsWith('/skill-tree')
                                                : location.pathname === item.url
                                        }
                                        tooltip={item.title}
                                    >
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-2">
                <Separator className="mb-2" />
                <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center">
                    <Avatar size="sm" className="shrink-0">
                        <AvatarFallback className="brand-gradient text-white text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-medium">{profile?.full_name || 'User'}</span>
                        <Badge variant="outline" className="w-fit text-xs capitalize mt-0.5">
                            {profile?.role === 'faculty' ? (
                                <><GraduationCap className="size-3 mr-1" /> Faculty</>
                            ) : (
                                'Student'
                            )}
                        </Badge>
                    </div>
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleSignOut}
                            tooltip="Sign out"
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <LogOut />
                            <span>Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
