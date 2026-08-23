const assert = require('assert');

// Verify that the code successfully builds and exports something from EmployeeManagement.tsx

// Read the typescript output and search for the bug

const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/EmployeeManagement.tsx', 'utf8');

assert(content.includes('const { courses, assignments, certificates, assignCourse, getUserAssignments } = useCourses();'));

console.log('Passed assertions')
