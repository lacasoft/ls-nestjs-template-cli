module.exports = {
  // TypeScript files (excluding templates and tests)
  'src/{commands,generators,utils}/**/*.ts': [
    'prettier --write',
    'eslint --fix',
  ],
  'src/*.ts': [
    'prettier --write',
    'eslint --fix',
  ],

  // TypeScript in templates - only format, no lint
  'src/templates/**/*.ts': ['prettier --write'],

  // JSON and Markdown (excluding templates)
  '*.{json,md}': (filenames) => {
    // Filter out files in src/templates/
    const filtered = filenames.filter(
      (filename) => !filename.includes('src/templates/')
    );

    if (filtered.length === 0) return [];

    return [`prettier --write ${filtered.join(' ')}`];
  },
};
