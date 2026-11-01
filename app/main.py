import mimetypes
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Windows registry can map .js to text/plain, which browsers refuse for module scripts.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")

BASE = Path(__file__).parent
DIST = BASE.parent / "frontend" / "dist"  # built with `npm run build` in frontend/

app = FastAPI(title="Eubank Technologies")
app.mount("/resources", StaticFiles(directory=BASE / "resources"), name="resources")
app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


# shortcut: keep in sync with the routes in frontend/src/App.jsx; unknown paths still render the
# React error page but get a real 404 status. Upgrade if routes become dynamic.
ROUTES = {"", "about", "contact", "privacy"}


# Client-side routing: every other path gets the React app, which renders its own routes.
@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    if path.startswith("api/"):
        raise HTTPException(404)
    # Real files in dist (sitemap.xml, robots.txt, ...); resolve() + is_relative_to() blocks ../ traversal.
    f = (DIST / path).resolve()
    if path and f.is_relative_to(DIST.resolve()) and f.is_file():
        return FileResponse(f)
    return FileResponse(DIST / "index.html", status_code=200 if path.strip("/") in ROUTES else 404)
