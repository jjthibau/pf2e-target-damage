"""Build only explicit public files with deterministic ZIP metadata."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ('module.json', 'scripts/main.js', 'styles/target-damage.css', 'README.md',
         'LICENSE', 'CHANGELOG.md', 'docs/architecture.md', 'docs/testing.md')
REPO = 'https://github.com/jjthibau/pf2e-target-damage'

def validate(tag=None):
    manifest = json.loads((ROOT / 'module.json').read_text(encoding='utf-8'))
    package = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    version = manifest['version']
    assert manifest['id'] == package['name'] == 'pf2e-target-damage'
    assert package['version'] == version
    assert tag is None or tag == 'v' + version, 'Tag/version mismatch'
    assert manifest['manifest'] == REPO + '/releases/latest/download/module.json'
    assert manifest['download'] == REPO + '/releases/download/v' + version + '/module.zip'
    assert manifest['url'] == REPO and manifest['bugs'] == REPO + '/issues'
    assert manifest['esmodules'] == ['scripts/main.js']
    assert manifest['styles'] == ['styles/target-damage.css']
    assert manifest['relationships']['systems'][0]['id'] == 'pf2e'
    assert '## ' + version + ' ' in (ROOT / 'CHANGELOG.md').read_text(encoding='utf-8')
    for relative in FILES:
        assert (ROOT / relative).is_file(), relative
    return manifest

def build(tag=None):
    manifest = validate(tag)
    dest = ROOT / 'dist'
    dest.mkdir(exist_ok=True)
    (dest / 'module.json').write_bytes((ROOT / 'module.json').read_bytes())
    with zipfile.ZipFile(dest / 'module.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for relative in FILES:
            entry = zipfile.ZipInfo(relative, (2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (ROOT / relative).read_bytes())
    sums = ''.join(hashlib.sha256((dest / f).read_bytes()).hexdigest() + '  ' + f + '\n'
                   for f in ('module.json', 'module.zip'))
    (dest / 'SHA256SUMS').write_text(sums, encoding='utf-8', newline='\n')
    (dest / 'RELEASE_NOTES.md').write_text((ROOT / 'CHANGELOG.md').read_text(encoding='utf-8'), encoding='utf-8')
    (dest / 'build.json').write_text(json.dumps({'version':manifest['version'], 'files':{
        f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in FILES}}, indent=2), encoding='utf-8')
    print('Built ' + manifest['version'] + ': ' + str(len(FILES)) + ' files')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--tag')
    build(parser.parse_args().tag)
