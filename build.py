"""Build the installable app (index.html) from ../food-passport.html.

Run from anywhere:  python3 build.py
It adds the manifest, icons, home-screen meta tags and the offline service worker.
"""
from pathlib import Path

here = Path(__file__).resolve().parent
src = (here.parent / 'food-passport.html').read_text(encoding='utf8')

head_tags = '''
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="favicon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="美食护照">'''

app_css = '''
/* installed app: keep content clear of the notch / home indicator */
.page{padding-top:max(18px,env(safe-area-inset-top))}
.cover{padding-top:max(24px,env(safe-area-inset-top));padding-bottom:max(24px,env(safe-area-inset-bottom))}
</style>'''

boot = '''
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
</script>
</body>'''

def once(s, old, new):
    assert s.count(old) == 1, old
    return s.replace(old, new)

out = once(src, '</title>', '</title>' + head_tags)
out = once(out, '</style>\n</head>', app_css + '\n</head>')
out = once(out, '</script>\n</body>', boot)
(here / 'index.html').write_text(out, encoding='utf8')
print('built index.html', len(out.encode('utf8')), 'bytes')
