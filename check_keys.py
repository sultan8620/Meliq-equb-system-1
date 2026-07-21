import re
import glob

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Finding elements inside map that might not have keys properly
    # This is a bit tricky with regex, but let's just find map with JSX returning.
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if '.map(' in line:
            # check the next few lines for key=
            chunk = '\n'.join(lines[i:i+5])
            if '<' in chunk and 'key=' not in chunk and 'return <' in chunk or ('=> (' in chunk and '<' in chunk and 'key=' not in chunk):
                print(f"{filepath}:{i+1}: {line.strip()}")
