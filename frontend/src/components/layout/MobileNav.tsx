import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    MessageSquare,
    BookOpen,
    GitBranch,
    Upload,
    GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function MobileNav() {
    const { profile } = useAuth()
    const location = useLocation()

    const studentNav = [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Trees', url: '/skill-tree', icon: GitBranch },
        { title: 'Tutor', url: '/tutor', icon: MessageSquare },
        { title: 'Courses', url: '/courses', icon: BookOpen },
    ]

    const facultyNav = [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Courses', url: '/courses', icon: BookOpen },
        { title: 'Knowledge', url: '/resources', icon: Upload },
        { title: 'Insights', url: '/insights', icon: GraduationCap },
    ]

    const nav = profile?.role === 'faculty' ? facultyNav : studentNav

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe md:hidden">
            {nav.map((item) => {
                const isActive = item.url === '/skill-tree' 
                    ? location.pathname.startsWith('/skill-tree')
                    : location.pathname === item.url

                return (
                    <Link
                        key={item.title}
                        to={item.url}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full ${
                            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </Link>
                )
            })}
        </div>
    )
}
