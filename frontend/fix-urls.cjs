const fs = require('fs');
const files = [
  'src/pages/StudyRoomPage.tsx',
  'src/pages/StudyCalendar.tsx',
  'src/pages/StudentAnalytics.tsx',
  'src/pages/RevisionDeck.tsx',
  'src/pages/FlashcardStudio.tsx',
  'src/pages/FacultyDashboard.tsx',
  'src/components/GlobalSearch.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  if (content.includes('http://localhost:8000') && !content.includes('API_BASE_URL')) {
    const importStatement = "import { API_BASE_URL } from '@/lib/api'\n";
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
  }
  
  content = content.replace(/io\('http:\/\/localhost:8000'\)/g, 'io(API_BASE_URL)');
  content = content.replace(/'http:\/\/localhost:8000\/api\/([^']+)'/g, '`${API_BASE_URL}/api/$1`');
  content = content.replace(/`http:\/\/localhost:8000\/api\/([^`]+)`/g, '`${API_BASE_URL}/api/$1`');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
