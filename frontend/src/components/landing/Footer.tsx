import { ExternalLink, Globe, Share2, Users } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-200/20 bg-slate-50/50 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        <div className="flex items-center gap-3 space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded p-2 text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Cogniva.</span>
        </div>
        <div className="flex gap-6 text-slate-500 font-medium">
          <a href="#" className="hover:text-blue-600 transition flex items-center gap-1 group">
            <Users className="w-4 h-4 group-hover:scale-110 transition" /> About
          </a>
          <a href="#" className="hover:text-blue-600 transition flex items-center gap-1 group">
            <Share2 className="w-4 h-4 group-hover:scale-110 transition" /> Blog
          </a>
          <a href="#" className="hover:text-blue-600 transition flex items-center gap-1 group">
            <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" /> Careers
          </a>
        </div>
        <div className="text-slate-400 text-sm">
          © {new Date().getFullYear()} Cogniva. The Cognitive Ethereal.
        </div>
      </div>
    </footer>
  )
}
