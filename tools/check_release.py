"""Verify archive membership, bytes and checksums."""
import hashlib
import zipfile
from build_release import FILES, ROOT, validate

validate()
dest = ROOT / 'dist'
with zipfile.ZipFile(dest / 'module.zip') as archive:
    assert sorted(archive.namelist()) == sorted(FILES), 'Unexpected release file'
    assert archive.testzip() is None
    for relative in FILES:
        assert archive.read(relative) == (ROOT / relative).read_bytes(), relative
assert (dest / 'module.json').read_bytes() == (ROOT / 'module.json').read_bytes()
for line in (dest / 'SHA256SUMS').read_text(encoding='utf-8').splitlines():
    expected, filename = line.split('  ')
    assert filename in ('module.json', 'module.zip')
    assert hashlib.sha256((dest / filename).read_bytes()).hexdigest() == expected
print('Release validated: exact files, source bytes and checksums')
