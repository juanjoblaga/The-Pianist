#!/usr/bin/env python3
"""Prepare an Android release using the single release manifest.

Never edit the stored signing key or application ID. Run after overlaying
editable/app/src/main onto the extracted legacy Android project.
"""
from pathlib import Path
import json
import os
import re

v = json.loads(Path("VERSION.json").read_text())
name = v["versionName"]
code = int(v["versionCode"])
expected = int(v["baselineVersionCode"])
assert re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,3}", name)
assert code > expected, "Android versionCode must increase from baseline"
assert v["applicationId"] == "com.thepianist.game"
assert Path(v["baselineZip"]).is_file()

gradle = Path("build-project/app/build.gradle")
source = gradle.read_text()
match_code = re.search(r"\bversionCode\s+(\d+)", source)
match_name = re.search(r"\bversionName\s+'([^']+)'", source)
match_id = re.search(r"\bapplicationId\s+'([^']+)'", source)
assert match_code and int(match_code.group(1)) == expected, "Unexpected baseline version"
assert match_name and match_id and match_id.group(1) == v["applicationId"], "Application identity changed"
source = re.sub(r"\bversionCode\s+\d+", f"versionCode {code}", source, count=1)
source = re.sub(r"\bversionName\s+'[^']+'", f"versionName '{name}'", source, count=1)
gradle.write_text(source)

# No manually mismatched release labels in the Android UI.
html = Path("build-project/app/src/main/assets/index.html")
txt = html.read_text()
txt = re.sub(r"APARTMENT · [0-9]+(?:\.[0-9]+)+", f"APARTMENT · {name}", txt)
txt = re.sub(r"The Pianist · v[0-9]+(?:\.[0-9]+)+", f"The Pianist · v{name}", txt)
html.write_text(txt)

if os.environ.get("GITHUB_ENV"):
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as out:
        out.write(f"APP_VERSION={name}\n")
print("Validated Android release", name, "versionCode", code, "package", v["applicationId"])
