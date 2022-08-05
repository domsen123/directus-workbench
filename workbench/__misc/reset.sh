git add -A .
git commit -m "before reset"

git checkout main && git fetch upstream main && git reset --hard upstream/main
git add -A . && git commit -m "reset" && git push origin main
git checkout workbench


rm -rf ./workbench/_instance/extensions/**/* && rm -rf app && rm -rf api && rm -rf packages

git checkout main -- api && git rm -r --cached --ignore-unmatch api
git checkout main -- app && git rm -r --cached --ignore-unmatch app
git checkout main -- packages && git rm -r --cached --ignore-unmatch packages

pnpm -r exec -- rm -rf node_modules && rm -rf node_modules

pnpm -r install && pnpm -r --filter=\!@directus/app run build
