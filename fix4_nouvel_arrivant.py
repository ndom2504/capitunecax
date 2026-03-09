"""
Script 4: Remove orphaned old 'rp' data that was left between the new
case 'rp' return array and case 'student'.
"""

PATH = r'c:\capitunecax\mobile\app\capi\nouvel-arrivant.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

total = len(lines)
print(f"Total lines: {total}")

# Find the first `      ];` after case 'rp': (line 168, 0-indexed: 167)
# Then find the `    case 'student':` marker
# Remove everything between them (exclusive: keep ]; and case 'student':)

rp_end = -1       # index of '      ];\n' that ends the NEW rp array
student_start = -1  # index of '    case'student':'

in_rp = False
for i, line in enumerate(lines):
    if line.strip() == "case 'rp':":
        in_rp = True
    if in_rp and line == '      ];\n' and rp_end == -1:
        # Found the first ]; after case 'rp'
        rp_end = i
        print(f"  rp_end at line {i+1}: {repr(line)}")
    if "case 'student':" in line:
        student_start = i
        print(f"  student_start at line {i+1}: {repr(line)}")
        break

if rp_end == -1 or student_start == -1:
    print("ERROR: markers not found")
    import sys; sys.exit(1)

print(f"Removing lines {rp_end+2} to {student_start} (1-based: {rp_end+2}–{student_start})")
print(f"That's {student_start - rp_end - 1} lines to remove")

new_lines = lines[:rp_end + 1] + ['\n'] + lines[student_start:]

with open(PATH, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done. New total lines: {len(new_lines)}")
