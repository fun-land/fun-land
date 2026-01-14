# Advanced Todo App - Showcasing Direct DOM Access

This Todo app demonstrates the advantages of **direct DOM access** over virtual DOM frameworks like React. Without a render loop getting in the way, we can leverage native browser APIs that are typically challenging in React.

## 🚀 Advanced Features

### 1. **Mouse-based Drag & Drop Reordering**
- Uses native mouse events (mousedown/mousemove/mouseup) for reliable drag behavior
- Smooth reordering with real-time feedback
- Custom drag ghost that follows cursor perfectly
- Visual indicators during drag operations (opacity, scale, shadow)
- No library dependencies needed!

**Why this is hard in React:**
- Virtual DOM diffing can interfere with drag state
- Event handlers need careful management to avoid re-render issues
- Maintaining drag ghost and visual feedback requires complex state management
- HTML5 drag API is unreliable - mouse events give full control

### 2. **FLIP Animations**
- **F**irst: Capture element positions before state change
- **L**ast: Capture positions after DOM update
- **I**nvert: Apply transform to appear at old position
- **P**lay: Animate to new position

This creates butter-smooth position animations when items are reordered or added.

**Why this is hard in React:**
- Need to coordinate animations across render cycles
- Virtual DOM reconciliation can destroy/recreate elements mid-animation
- Requires refs, useLayoutEffect, and careful timing

### 3. **Enter/Exit Animations**
- New items slide in from the left
- Deleted items fade out and slide away
- CSS animations work seamlessly because elements persist

**Why this is hard in React:**
- Elements unmount immediately on removal
- Need special libraries (react-transition-group, framer-motion)
- Complex coordination between state and animation lifecycle

### 4. **Web Animations API**
- Using native `element.animate()` for smooth transitions
- Hardware accelerated transforms
- No CSS-in-JS overhead

**Why this is natural here:**
- We have stable element references (no re-renders destroying them)
- Can directly call animate() whenever we want
- Animations persist across state changes

### 5. **Persistent Event Listeners**
- Event handlers attached once, never recreated
- Using `{ signal }` for automatic cleanup via AbortController
- No closure issues or stale state problems

**Why this is hard in React:**
- Event handlers recreated on every render (unless useCallback)
- Dependencies need careful management
- Easy to create memory leaks with manual listeners

## 🎨 Interaction Details

### Visual Feedback
- **Drag handle** (⋮⋮) changes color and scales on hover
- **Dragging item** becomes semi-transparent and scales down
- **Drop target** highlights with purple border and background
- **All buttons** have hover effects with transforms
- **Priority indicator**: High priority items show red left border

### Animations
- **Add item**: Slides in from left with fade
- **Remove item**: Fades out and slides left, then other items smoothly move up
- **Reorder**: Items smoothly animate to new positions (FLIP)
- **All Done**: Celebration text bounces in

### Touch & Accessibility
- Drag handles are clear and visible
- Color-coded priority system
- High contrast for readability
- Smooth focus states on form controls

## 🛠 Technical Architecture

### Component Pattern
Components are **run-once functions** that:
1. Create DOM elements
2. Set up subscriptions with AbortSignal
3. Return the element

```typescript
const Todo: Component<TodoProps> = (signal, props) => {
  // Create elements once
  const li = h("li", { className: "todo-item" });

  // Set up subscriptions (cleaned up via signal)
  props.state.watch(signal, (data) => {
    // Direct DOM updates, no re-render
    input.value = data.label;
  });

  return li; // Element persists until unmounted
};
```

### State Management
Using `bindListChildren()` for efficient list rendering:
- Preserves DOM elements across reorders (crucial for animations!)
- Each item gets its own AbortController for cleanup
- Only affected elements update, others remain untouched

### FLIP Implementation
```typescript
// Before state change: capture positions
const captureFlipFirst = () => {
  items.forEach(item => {
    const el = document.querySelector(`[data-key="${item.key}"]`);
    positions.set(item.key, el.getBoundingClientRect());
  });
};

// After state change: animate from old to new position
const applyFlipAnimation = () => {
  requestAnimationFrame(() => {
    positions.forEach((first, key) => {
      const el = document.querySelector(`[data-key="${key}"]`);
      const last = el.getBoundingClientRect();
      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;

      // Animate using Web Animations API
      el.animate([
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: "translate(0, 0)" }
      ], { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
    });
  });
};
```

## 💡 Key Differences from React

| Feature | fun-web | React |
|---------|---------|-------|
| **Drag & Drop** | Mouse events with custom ghost, full control | Complex, needs libraries or fights with virtual DOM |
| **FLIP Animations** | Natural - elements persist | Hard - elements recreate, need refs + useLayoutEffect |
| **Enter/Exit** | CSS animations just work | Need react-transition-group or framer-motion |
| **Event Handlers** | Attach once, AbortSignal cleanup | Recreate every render (unless useCallback) |
| **Performance** | Update only changed properties | Full reconciliation pass on state change |
| **Mental Model** | Direct DOM manipulation | Declarative state → UI |

## 🎯 What This Demonstrates

1. **No Virtual DOM overhead** - Direct DOM updates are fast
2. **Stable references** - Elements persist, animations work naturally
3. **Native APIs** - Use browser features without fighting framework
4. **Simpler mental model** - See exactly what DOM operations happen
5. **Better for interactions** - Complex animations and effects are straightforward

## 🏃‍♂️ Try It Out

Open `index.html` in a browser and:
- **Drag items** by the handle (⋮⋮) to reorder
- **Add items** and watch them slide in
- **Delete items** and watch them fade out
- **Check all** and see the celebration
- Notice how **smooth** everything feels!

---

This is what's possible when you embrace direct DOM access instead of fighting a render loop. 🎉
