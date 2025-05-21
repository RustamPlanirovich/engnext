const fs = require('fs');
const path = require('path');

// Function to process a lesson file
function processLessonFile(filePath) {
  try {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    const lesson = JSON.parse(data);
    
    // Process each subconcept
    lesson.subconcepts.forEach(subconcept => {
      if (subconcept.examples && Array.isArray(subconcept.examples)) {
        // Add learn field to each example
        subconcept.examples.forEach(example => {
          if (!example.hasOwnProperty('learn')) {
            example.learn = 0;
          }
        });
      }
    });
    
    // Write the updated file
    fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2), 'utf8');
    console.log(`✅ Successfully updated ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
  }
}

// Process all lesson files
const lessonFiles = [
  '/Users/rustam/Desktop/engnext/data/lessons/lesson1.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson2.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson3.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson4.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson5.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson6.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson7.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson8.json',
  '/Users/rustam/Desktop/engnext/data/lessons/lesson9.json'
];

// Process each file
lessonFiles.forEach(filePath => {
  processLessonFile(filePath);
});

console.log('All lesson files have been processed.');
