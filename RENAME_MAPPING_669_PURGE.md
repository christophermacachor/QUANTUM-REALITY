# Navigate to web root
cd /var/www/html/macachor.org/

# Rename the three 669 files
mv phi669-empirical-analysis.html omega-empirical-analysis.html
mv phi669_empirical_resources.html omega-empirical-resources.html

# Verify no 669 references remain in filenames
find . -name "*669*" -type f
# Expected output: (nothing)

# Update any internal links that reference the old filenames
# (grep to find references in other HTML files)
grep -rl "phi669" . --include="*.html"
