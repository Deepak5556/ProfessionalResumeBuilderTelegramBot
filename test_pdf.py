import os
import subprocess
import pathlib

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
html_path = "test.html"
pdf_path = "test.pdf"

html_content = "<h1>Hello PDF</h1><p>Test PDF generation from Edge.</p>"
with open(html_path, "w") as f:
    f.write(html_content)

html_url = pathlib.Path(os.path.abspath(html_path)).as_uri()
cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    f"--print-to-pdf={os.path.abspath(pdf_path)}",
    html_url
]

print(f"Running: {' '.join(cmd)}")
result = subprocess.run(cmd, capture_output=True, text=True)
print(f"Exit code: {result.returncode}")
if os.path.exists(pdf_path):
    print("SUCCESS: PDF generated.")
else:
    print(f"FAILURE: PDF not generated. Stderr: {result.stderr}")
