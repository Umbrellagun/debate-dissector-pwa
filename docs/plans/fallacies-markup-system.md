# Debate Dissector: Logical Fallacies, Rhetoric Arguments, and Text Markup System

This document summarizes the logical fallacy categorization, rhetoric argument labeling, and text markup functionality of the original Debate Dissector application, providing a reference for the PWA rebuild.

## Logical Fallacy Categorization

The original Debate Dissector organizes logical fallacies into a hierarchical structure:

### Main Categories
1. **Formal Fallacies** - Errors in the structure of logical arguments
2. **Informal Fallacies** - Errors in the content of arguments
3. **Red Herring Fallacies** - Diversionary tactics in argumentation
4. **Propositional Fallacies** - Errors in propositional logic
5. **Quantification Fallacies** - Errors involving quantifiers
6. **Formal Syllogistic Fallacies** - Errors in syllogistic reasoning
7. **Faulty Generalizations** - Errors in inductive reasoning
8. **Conditional or Questionable Fallacies** - Fallacies that depend on context

Each fallacy within these categories contains:
- A name (e.g., "Straw Man")
- A description explaining the fallacy
- A unique color code for text highlighting

## Rhetoric Argument Categorization

In addition to logical fallacies, Debate Dissector supports labeling rhetoric and persuasion techniques. Unlike fallacies (which represent flawed reasoning), rhetoric arguments are legitimate persuasion techniques that may or may not be used ethically.

### Rhetoric Categories
1. **Ethos (Credibility)** - Appeals to authority, character, or trustworthiness
2. **Pathos (Emotional)** - Appeals to emotions, values, or desires
3. **Logos (Logical)** - Appeals to logic, reason, and evidence
4. **Kairos (Timing)** - Appeals to timeliness and appropriateness

### Rhetoric Techniques
Each rhetoric technique contains:
- A name (e.g., "Appeal to Authority")
- A description explaining the technique
- A category (Ethos, Pathos, Logos, or Kairos)
- A unique color code for text highlighting (distinct from fallacy colors)

### Distinguishing Fallacies from Rhetoric
- **Fallacies**: Flawed reasoning that undermines an argument's validity
- **Rhetoric**: Persuasion techniques that may be valid but warrant identification

The UI should clearly distinguish between these two markup types, allowing users to identify both flawed logic AND persuasion techniques in debate text.

### Markup Process Flow

1. User creates or opens a debate document
2. User selects text they want to mark as containing a specific fallacy
3. User clicks on the corresponding fallacy button in the toolbar
4. The application applies the appropriate inline style to the selected text
5. The text is now visually marked with the fallacy's color

Example code for applying markup:
```javascript
_toggleStrawMan() {
  this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'STRAWMAN'));
}
```

## User Interface Components

1. **Fallacy Reference Panel**: Right sidebar displaying all fallacy categories and descriptions
2. **Text Editor**: Central area where users create and mark up text
3. **Markup Tools**: Buttons for applying fallacy markups to selected text

## Considerations for PWA Rebuild

When rebuilding this system with Slate.js in the PWA:

1. **Data Model**: Create TypeScript interfaces for fallacies, rhetoric techniques, and their categories
2. **Custom Formatting**: Use Slate.js's node-based approach for applying fallacy and rhetoric markups
3. **Color System**: Transfer the existing color system and add distinct colors for rhetoric techniques
4. **UI Components**: Create equivalent components for the fallacy/rhetoric reference panel and markup tools
5. **Slate.js Integration**: Implement selection-based markup functionality using Slate.js APIs
6. **Clear Formatting**: Add ability to remove fallacy/rhetoric marks and text formatting from selected text
7. **Multiple Annotations**: Support overlapping annotations (multiple fallacies/rhetoric on same text)
8. **App Version**: Display application version in settings or footer

### UI Layout Considerations
- **Title Editor**: Editable document title positioned above the text editor
- **Hamburger Menu**: Access to left sidebar with document list and navigation
- **Right Panel**: Collapsible panel for fallacy and rhetoric selection
- **Clear/Remove Tools**: Toolbar or context menu options to remove annotations

The rebuilt system should maintain the ease of use of the original while improving performance and extensibility.
