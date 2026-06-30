const fs = require('fs');
const path = require('path');

function processFile(fullPath) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // Fix main backgrounds and text colors
    content = content.replace(/text-\[#F8FAFC\]/g, 'text-[#F9F9F9]');

    // Let's refine bg colors. 
    // In dark mode, main bg is #000000. 
    // If we have bg-[#333333] it might be a card or a main background.
    // In App.tsx min-h-screen bg is the main bg.
    if (fullPath.endsWith('App.tsx')) {
        content = content.replace(/bg-\[#333333\] text-\[#F9F9F9\]/g, 'bg-[#000000] text-[#F9F9F9]');
        content = content.replace(/bg-\[#333333\]\/80/g, 'bg-[#000000]/80');
    }

    if (fullPath.endsWith('DashboardView.tsx')) {
        // Main view backgrounds are sometimes set to #333333. Let's find them and make them #000000 where appropriate, or leave as #333333 for cards.
        // Line 124: theme === 'dark' ? 'bg-[#333333]' : 'bg-[#F9F9F9]' - This is top header section bg, maybe make it #000000.
        // Line 408: theme === 'dark' ? 'bg-[#333333]' : 'bg-white' - This is a card, leave as #333333.
        content = content.replace(/className="w-full bg-\[#333333\]/g, 'className="w-full bg-[#000000]');
        content = content.replace(/theme === 'dark' \? 'bg-\[#333333\]' : 'bg-\[#F9F9F9\]'/g, "theme === 'dark' ? 'bg-[#000000]' : 'bg-[#F9F9F9]'");
    }

    if (fullPath.endsWith('ProjectsView.tsx') || fullPath.endsWith('ProfileSetupFlow.tsx') || fullPath.endsWith('AuthView.tsx') || fullPath.endsWith('OnboardingFlow.tsx')) {
        content = content.replace(/theme === 'dark' \? 'bg-\[#333333\]' : 'bg-\[#F9F9F9\]'/g, "theme === 'dark' ? 'bg-[#000000]' : 'bg-[#F9F9F9]'");
        // Also fix background of main views
        content = content.replace(/className=".*bg-\[#333333\].*min-h-screen/g, function(match) {
            return match.replace('#333333', '#000000');
        });
    }
    
    // Fix any stray 1f242f which got changed to #000000 for secondary backgrounds. Actually, #1f242f to #000000 is fine if the main background is #000000.
    // Wait, the secondary dark surface could be #333333.
    // If I changed #1f242f to #000000, maybe it should be #646464 or #333333?
    
    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Refined bg in ${fullPath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            processFile(fullPath);
        }
    }
}

walkDir('src');
