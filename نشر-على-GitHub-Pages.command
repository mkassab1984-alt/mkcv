#!/usr/bin/env python3
import base64, json, os, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

CLIENT_ID = "178c6fc778ccc68e1d6a"
UA = "mamdouh-cv-deployer/1.0"
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def http_json(url, method="GET", data=None, headers=None, form=False):
    hdrs = {"Accept": "application/vnd.github+json", "User-Agent": UA}
    if headers:
        hdrs.update(headers)
    body = None
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode("utf-8")
            hdrs["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode("utf-8")
            hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw.strip() else {}
        except Exception:
            parsed = {"raw": raw}
        return e.code, parsed

def main():
    print("\n=== نشر موقع ممدوح كساب إسماعيل تلقائياً على GitHub Pages ===\n", flush=True)
    status, dev = http_json(
        "https://github.com/login/device/code",
        method="POST",
        data={"client_id": CLIENT_ID, "scope": "public_repo"},
        headers={"Accept": "application/json"},
        form=True,
    )
    if status != 200 or "device_code" not in dev:
        print(f"تعذر بدء التفويض ({status}): {dev}", flush=True)
        input("\nاضغط Enter للإغلاق...")
        sys.exit(1)

    user_code = dev["user_code"]
    verify_uri = dev.get("verification_uri", "https://github.com/login/device")
    device_code = dev["device_code"]
    interval = int(dev.get("interval", 5)) + 1

    try:
        p = subprocess.Popen(["/usr/bin/pbcopy"], stdin=subprocess.PIPE)
        p.communicate(user_code.encode("utf-8"))
    except Exception:
        pass
    try:
        subprocess.Popen(["/usr/bin/open", verify_uri])
    except Exception:
        pass

    print(f"1) تم نسخ رمز التفعيل تلقائياً إلى الحافظة:  {user_code}")
    print(f"2) تم فتح صفحة GitHub في المتصفح: {verify_uri}")
    print("3) الصق الرمز في المتصفح واضغط Authorize لإتمام الرفع تلقائياً...\n", flush=True)

    token = None
    for _ in range(150):
        time.sleep(interval)
        st, tok_res = http_json(
            "https://github.com/login/oauth/access_token",
            method="POST",
            data={
                "client_id": CLIENT_ID,
                "device_code": device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
            headers={"Accept": "application/json"},
            form=True,
        )
        if "access_token" in tok_res:
            token = tok_res["access_token"]
            break
        if tok_res.get("error") == "slow_down":
            interval += 5
        elif tok_res.get("error") not in ("authorization_pending", ""):
            print("انتهت عملية التفويض:", tok_res.get("error"))
            input("\nاضغط Enter للإغلاق...")
            sys.exit(1)

    if not token:
        print("انتهت المهلة قبل تأكيد التفويض.")
        input("\nاضغط Enter للإغلاق...")
        sys.exit(1)

    auth_hdr = {"Authorization": f"Bearer {token}", "X-GitHub-Api-Version": "2022-11-28"}
    st, user_info = http_json("https://api.github.com/user", headers=auth_hdr)
    owner = user_info["login"]
    print(f"تم تسجيل الدخول لحساب: {owner} — جاري تجهيز المستودع ورفع الملفات...", flush=True)

    root_repo = f"{owner}.github.io"
    st_check, _ = http_json(f"https://api.github.com/repos/{owner}/{root_repo}", headers=auth_hdr)
    repo = root_repo if st_check == 404 else "mamdouh-kassab-cv"

    st_repo, repo_info = http_json(f"https://api.github.com/repos/{owner}/{repo}", headers=auth_hdr)
    if st_repo == 404:
        st_create, repo_info = http_json(
            "https://api.github.com/user/repos",
            method="POST",
            data={
                "name": repo,
                "description": "Mamdouh Kassab Ismail — Senior Bilingual Content Writer, Marketing Consultant & Creative Director",
                "private": False,
                "auto_init": True,
            },
            headers=auth_hdr,
        )
        time.sleep(2)

    default_branch = repo_info.get("default_branch", "main") or "main"
    skip_ext = (".command", ".bat")
    files_to_upload = {".nojekyll": b""}
    canonical_base = f"https://{owner}.github.io/" if repo == root_repo else f"https://{owner}.github.io/{repo}/"
    for dirpath, _, filenames in os.walk(ROOT_DIR):
        for fn in filenames:
            if fn == ".DS_Store" or fn.endswith(skip_ext):
                continue
            full_p = os.path.join(dirpath, fn)
            rel_p = os.path.relpath(full_p, ROOT_DIR).replace("\\", "/")
            raw_b = open(full_p, "rb").read()
            if rel_p in ("index.html", "standalone.html"):
                raw_b = raw_b.replace(
                    b'content="og-preview.png"',
                    f'content="{canonical_base}og-preview.png"'.encode("utf-8"),
                )
            files_to_upload[rel_p] = raw_b

    st_ref, ref_info = http_json(f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{default_branch}", headers=auth_hdr)
    if st_ref != 200:
        http_json(
            f"https://api.github.com/repos/{owner}/{repo}/contents/.nojekyll",
            method="PUT",
            data={"message": "Initialize repository", "content": "", "branch": default_branch},
            headers=auth_hdr,
        )
        time.sleep(1.5)
        st_ref, ref_info = http_json(f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{default_branch}", headers=auth_hdr)

    parent_sha = ref_info["object"]["sha"]
    tree_items = []
    for rel_path, raw_bytes in sorted(files_to_upload.items()):
        _, blob_info = http_json(
            f"https://api.github.com/repos/{owner}/{repo}/git/blobs",
            method="POST",
            data={"content": base64.b64encode(raw_bytes).decode("ascii"), "encoding": "base64"},
            headers=auth_hdr,
        )
        tree_items.append({"path": rel_path, "mode": "100644", "type": "blob", "sha": blob_info["sha"]})

    _, tree_info = http_json(f"https://api.github.com/repos/{owner}/{repo}/git/trees", method="POST", data={"tree": tree_items}, headers=auth_hdr)
    _, commit_info = http_json(
        f"https://api.github.com/repos/{owner}/{repo}/git/commits",
        method="POST",
        data={"message": "Deploy Mamdouh Kassab Ismail CV website", "tree": tree_info["sha"], "parents": [parent_sha]},
        headers=auth_hdr,
    )
    http_json(f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{default_branch}", method="PATCH", data={"sha": commit_info["sha"], "force": True}, headers=auth_hdr)
    http_json(f"https://api.github.com/repos/{owner}/{repo}/pages", method="POST", data={"source": {"branch": default_branch, "path": "/"}}, headers=auth_hdr)
    time.sleep(2)
    st_getp, pages_meta = http_json(f"https://api.github.com/repos/{owner}/{repo}/pages", headers=auth_hdr)
    live_url = pages_meta.get("html_url") if st_getp == 200 else (f"https://{owner}.github.io/" if repo == root_repo else f"https://{owner}.github.io/{repo}/")

    print(f"\nتم رفع الموقع وتفعيل GitHub Pages بنجاح!")
    print(f"رابط المستودع: https://github.com/{owner}/{repo}")
    print(f"رابط الموقع الحي (يجهز خلال 30-60 ثانية): {live_url}\n", flush=True)
    try:
        subprocess.Popen(["/usr/bin/open", live_url])
    except Exception:
        pass
    input("اضغط Enter للإغلاق...")

if __name__ == "__main__":
    main()
