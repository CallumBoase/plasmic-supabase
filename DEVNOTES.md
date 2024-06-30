## Dev notes
* Fork repo
    There's various ways to fork a repo, but we outline how to do it via the Github user interface here
  1. Go to [Plasmic Supabase Github Repo](https://github.com/CallumBoase/plasmic-supabase)
  2. Click the "Fork" button
  3. You'll see a page where you can decide what to call your forked repo on the next page. Configure the settings then click "Create fork" at the bottom of the page
  4. Your new forked repo should open up in github
* Develop changes in forked repo
    1. Develop your changes to Plasmic-supabase in your forked repo as required. You'll usually want to clone your forked repo from github to your local machine and test them locally (see below).
* Testing changes locally
    1. In your forked version of plasmic-supabase repo (cloned to your machine)
        1. run `npm run build`
        2. run `npm pack` to create a tarball of the package (eg `plasmic-supabase-0.0.1.tgz`) (important: `npm link` does NOT work due to react conflicts)
    2. In your local Plasmic nextjs project, 
        1. run `npm install /path/to/plasmic-supabase-0.0.1.tgz` to install the package
        2. run `npm run dev` to start the dev server
* To retest a new version of local package locally
    1. Follow step 1 above
    2. In your local plasmic nextjs project:
        1. Stop your dev server
        2. run `npm uninstall plasmic-supabase` 
        3. Clear nextjs cache by deleting `.next` folder
        4. (usually not needed): clear node cache `npm cache clean --force`
        5. run `npm install /path/to/plasmic-supabase-0.0.1.tgz`
        6. run `npm run dev` to start the dev server
* To add your changes to the main plasmic-supabase repo
    1. Go to the main plasmic-supabase repo (not your fork)
    2. Click "Pull reqests"
    3. Click "new pull requests"
    4. Click "Compare accross forks"
    5. Find your fork & the branch you want to request merge of
    6. Click "Create pull request"
    7. Add any useful descrptions etc to explain what your changes do. Then finally click "Create pull request"
    8. We will now review your changes etc and discuss any issues, eventually merging your changes if they are suitable. 
      

* To publish this package to npm (package maintainers only)
    1. Update the version in `package.json`
    2. Update changelog
    3. Push all changes to github
    4. Run npm publish
    5. In github user interface: create a new release & tag with same version number
