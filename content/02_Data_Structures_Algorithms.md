# 02 — DATA STRUCTURES & ALGORITHMS
> 🧒 = Explain like a 12-year-old | ⚠️ = Interview trap | 🔁 = Rebuild from memory

---

## TOPIC TRACKER
| # | Topic | Status |
|---|-------|--------|
| 1 | Big O Notation | ⬜ |
| 2 | Arrays | ⬜ |
| 3 | Linked List | ⬜ |
| 4 | Stack & Queue | ⬜ |
| 5 | HashMap / HashSet | ⬜ |
| 6 | Trees (Binary, BST) | ⬜ |
| 7 | Heap (PriorityQueue) | ⬜ |
| 8 | Graphs | ⬜ |
| 9 | Sorting Algorithms | ⬜ |
| 10 | Searching | ⬜ |
| 11 | Recursion & Dynamic Programming | ⬜ |
| 12 | Common Interview Patterns | ⬜ |

---

## 1. BIG O NOTATION

> 🧒 Big O = "how much slower does your code get as the input grows?"

```
O(1)       — constant time  — HashMap get, array[i]
O(log n)   — halves each step — Binary search, BST ops
O(n)       — linear         — Loop through array once
O(n log n) — efficient sort — MergeSort, QuickSort avg
O(n²)      — nested loops   — BubbleSort, naive algorithms
O(2ⁿ)      — exponential    — Recursive Fibonacci (bad!)
```

### Space Complexity
```
O(1)  — no extra memory
O(n)  — extra array/list proportional to input
O(n²) — 2D matrix
```

### ⚠️ Traps
- Drop constants: `O(2n)` = `O(n)`. Drop lower terms: `O(n² + n)` = `O(n²)`.
- Best case rarely matters in interviews. They want average or worst case.

---

## 2. ARRAYS

```java
// Fixed size
int[] arr = new int[5];          // [0,0,0,0,0]
int[] arr = {1, 2, 3, 4, 5};

// 2D array
int[][] matrix = new int[3][4];
matrix[0][1] = 5;

// Useful methods
Arrays.sort(arr);                // O(n log n)
Arrays.binarySearch(arr, 3);     // O(log n) — must be sorted first
Arrays.fill(arr, 0);             // fill with value
Arrays.copyOfRange(arr, 1, 4);   // [1..3]
Arrays.toString(arr);            // "[1, 2, 3]"
```

### Common Patterns
```java
// Two Pointers — find pair summing to target
int left = 0, right = arr.length - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) return new int[]{left, right};
    else if (sum < target) left++;
    else right--;
}

// Sliding Window — max sum subarray of size k
int windowSum = 0;
for (int i = 0; i < k; i++) windowSum += arr[i];
int maxSum = windowSum;
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i-k];
    maxSum = Math.max(maxSum, windowSum);
}
```

| Operation | Array | ArrayList |
|-----------|-------|-----------|
| Access by index | O(1) | O(1) |
| Insert at end | O(1) | O(1) amortized |
| Insert in middle | O(n) | O(n) |
| Search | O(n) | O(n) |

---

## 3. LINKED LIST

> 🧒 Like a treasure hunt: each clue has the next clue's location. No random access — must follow chain.

```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

// Traverse
ListNode curr = head;
while (curr != null) {
    System.out.println(curr.val);
    curr = curr.next;
}

// Reverse a linked list (very commonly asked)
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next; // save next
    curr.next = prev;          // reverse pointer
    prev = curr;               // move prev
    curr = next;               // move curr
}
return prev; // new head

// Detect cycle (Floyd's algorithm)
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true; // cycle!
}
return false;

// Find middle
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
return slow; // slow is at middle
```

| Operation | Singly LL | Doubly LL |
|-----------|-----------|-----------|
| Insert at head | O(1) | O(1) |
| Insert at tail | O(n) / O(1) with tail ptr | O(1) |
| Delete by value | O(n) | O(n) |
| Access by index | O(n) | O(n) |

### ⚠️ Traps
- Always check `null` before accessing `.next`.
- Dummy/sentinel head node simplifies edge cases.
- `LinkedList` in Java = doubly linked list. Implements both `List` and `Deque`.

---

## 4. STACK & QUEUE

### Stack (LIFO — Last In, First Out)
> 🧒 Stack of plates. Last placed = first taken.
```java
// Use ArrayDeque as Stack (not Stack class — legacy)
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.push(2); stack.push(3);
stack.pop();    // 3 (removes)
stack.peek();   // 2 (just looks)

// Use cases: undo/redo, brackets matching, DFS, call stack
```

### Queue (FIFO — First In, First Out)
> 🧒 Line at a ticket counter. First person in = first served.
```java
Queue<Integer> queue = new LinkedList<>();
// or: Queue<Integer> queue = new ArrayDeque<>();
queue.offer(1); queue.offer(2); queue.offer(3);
queue.poll();   // 1 (removes)
queue.peek();   // 2 (just looks)

// PriorityQueue — always removes smallest first (min-heap)
PriorityQueue<Integer> pq = new PriorityQueue<>();
PriorityQueue<Integer> maxPq = new PriorityQueue<>(Comparator.reverseOrder());

// Use cases: BFS, scheduling, K largest/smallest
```

### Common Problem: Valid Brackets
```java
boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') stack.push(c);
        else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == ']' && top != '[') return false;
            if (c == '}' && top != '{') return false;
        }
    }
    return stack.isEmpty();
}
```

---

## 5. HASHMAP / HASHSET INTERNALS

```
put("key", value):
1. hash = "key".hashCode()         // e.g. 1289023
2. index = hash % capacity         // e.g. 7
3. arr[7] → check if key exists (equals)
4. If collision → chain (LinkedList → Tree if >8 nodes)

get("key"):
1. Same hash → same index
2. Check bucket with equals()
```

### Custom Object as Key — RULES
```java
class Person {
    String name; int age;

    // MUST override both if using as Map key
    @Override public boolean equals(Object o) {
        Person p = (Person) o;
        return name.equals(p.name) && age == p.age;
    }
    @Override public int hashCode() {
        return Objects.hash(name, age);
    }
}
```

> ⚠️ If two objects are equal, they MUST have same hashCode. Reverse not required.

---

## 6. TREES

### Binary Tree
> 🧒 Like a family tree. Each person (node) has at most 2 children (left, right).

```java
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}
```

### Tree Traversals
```java
// Inorder: Left → Root → Right (gives sorted order in BST)
void inorder(TreeNode node) {
    if (node == null) return;
    inorder(node.left);
    System.out.println(node.val);
    inorder(node.right);
}

// Preorder: Root → Left → Right (copy tree)
// Postorder: Left → Right → Root (delete tree)

// Level-order (BFS) — use Queue
void levelOrder(TreeNode root) {
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        TreeNode node = q.poll();
        System.out.println(node.val);
        if (node.left != null) q.offer(node.left);
        if (node.right != null) q.offer(node.right);
    }
}
```

### Binary Search Tree (BST)
- Left subtree: all values < root.
- Right subtree: all values > root.
- Inorder traversal = sorted ascending.
- Search/Insert/Delete: O(log n) average, O(n) worst (unbalanced).

### Balanced BST Types
| Type | Balance | Used In |
|------|---------|---------|
| AVL Tree | strict | read-heavy |
| Red-Black Tree | relaxed | `TreeMap`, `TreeSet` |
| B-Tree | multi-way | Database indexes |

### Height & Depth
```java
int height(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
}
```

---

## 7. HEAP (PRIORITY QUEUE)

> 🧒 Heap = a special tree where parent is always smaller (min-heap) than children.

```
Min-Heap:       Max-Heap:
     1                9
   /   \            /   \
  3     2          7     8
 / \   /          / \   /
5  4  6          2  3  1
```

```java
// Min-heap (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll(); // 1 — always smallest

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Kth largest element
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int n : nums) {
    minHeap.offer(n);
    if (minHeap.size() > k) minHeap.poll(); // keep only k largest
}
return minHeap.peek(); // kth largest
```

| Operation | Heap |
|-----------|------|
| Insert | O(log n) |
| Get min/max | O(1) |
| Remove min/max | O(log n) |
| Build heap | O(n) |

---

## 8. GRAPHS

> 🧒 Graph = nodes (cities) connected by edges (roads). Can be directed or undirected.

```java
// Adjacency List (most common)
Map<Integer, List<Integer>> graph = new HashMap<>();
graph.put(1, Arrays.asList(2, 3));
graph.put(2, Arrays.asList(4));
graph.put(3, Arrays.asList(4));
graph.put(4, Arrays.asList());

// DFS (Depth First Search) — go deep first, backtrack
void dfs(int node, Set<Integer> visited, Map<Integer, List<Integer>> graph) {
    if (visited.contains(node)) return;
    visited.add(node);
    System.out.println(node);
    for (int neighbor : graph.getOrDefault(node, List.of())) {
        dfs(neighbor, visited, graph);
    }
}

// BFS (Breadth First Search) — level by level, shortest path in unweighted
void bfs(int start, Map<Integer, List<Integer>> graph) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    visited.add(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.println(node);
        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
}
```

| Algorithm | Use |
|-----------|-----|
| BFS | Shortest path (unweighted), level traversal |
| DFS | Cycle detection, path finding, topological sort |
| Dijkstra | Shortest path (weighted, no negative) |
| Topological Sort | Task scheduling, build order |

---

## 9. SORTING ALGORITHMS

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |

> Java's `Arrays.sort()` uses Dual-Pivot Quicksort for primitives, TimSort for objects.
> TimSort = Merge Sort + Insertion Sort hybrid. Stable, O(n log n).

### Merge Sort (important — know this)
```java
void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = (left + right) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid+1, right);
    merge(arr, left, mid, right);
}

void merge(int[] arr, int left, int mid, int right) {
    int[] temp = Arrays.copyOfRange(arr, left, right+1);
    int i = 0, j = mid-left+1, k = left;
    while (i <= mid-left && j <= right-left) {
        if (temp[i] <= temp[j]) arr[k++] = temp[i++];
        else arr[k++] = temp[j++];
    }
    while (i <= mid-left) arr[k++] = temp[i++];
    while (j <= right-left) arr[k++] = temp[j++];
}
```

---

## 10. SEARCHING

### Binary Search — O(log n) — MUST be sorted
```java
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2; // avoids overflow vs (l+r)/2
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1; // not found
}

// Find first occurrence (leftmost)
// change: if (arr[mid] == target) { result = mid; right = mid - 1; }
```

### ⚠️ Traps
- Use `left + (right - left) / 2` not `(left + right) / 2` — avoids integer overflow.
- Binary search works on any monotonically changing condition, not just sorted arrays.

---

## 11. RECURSION & DYNAMIC PROGRAMMING

### Recursion Template
```java
returnType solve(params) {
    // 1. Base case
    if (base condition) return base value;
    // 2. Recursive case
    return combine(solve(smaller problem));
}
```

### Dynamic Programming — avoid recalculating subproblems
> 🧒 DP = remember your work. Don't solve the same puzzle twice.

```java
// Fibonacci — naive O(2ⁿ)
int fib(int n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }

// Fibonacci — memoization (top-down) O(n)
Map<Integer, Long> memo = new HashMap<>();
long fib(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    long result = fib(n-1) + fib(n-2);
    memo.put(n, result);
    return result;
}

// Fibonacci — tabulation (bottom-up) O(n), O(1) space
long fib(int n) {
    if (n <= 1) return n;
    long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long c = a + b; a = b; b = c;
    }
    return b;
}
```

### Common DP Problems
| Problem | Pattern |
|---------|---------|
| Fibonacci | Linear DP |
| Coin Change | Unbounded knapsack |
| Longest Common Subsequence | 2D DP |
| 0/1 Knapsack | Include/exclude |
| Longest Increasing Subsequence | O(n²) or O(n log n) |

---

## 12. COMMON INTERVIEW PATTERNS

| Pattern | When to use | Data Structure |
|---------|------------|----------------|
| Two Pointers | Sorted array, pair sum, palindrome | Array |
| Sliding Window | Subarray/substring problems | Array/String |
| Fast & Slow Pointers | Cycle detection, find middle | Linked List |
| BFS | Shortest path, level order | Queue |
| DFS | All paths, cycle detect, backtracking | Stack/Recursion |
| Monotonic Stack | Next greater element | Stack |
| Top K Elements | K largest/smallest | Heap |
| Binary Search | Search in sorted, find boundary | Array |
| Dynamic Programming | Overlapping subproblems | Array/Map |
| Union-Find | Connected components | Array |

### HashMap as Frequency Counter
```java
// Most common pattern in interviews
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.merge(c, 1, Integer::sum); // or
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}
```

---

## 🔁 REBUILD CHALLENGES

1. What is the time complexity of: HashMap get, ArrayList get(i), LinkedList get(i), BST search?
2. Write binary search from memory.
3. Reverse a linked list — explain each pointer step.
4. What's the difference between BFS and DFS? When to use each?
5. Explain HashMap collision handling internally.
6. What is a min-heap? How does PriorityQueue work?
7. When would you use a Stack vs Queue?
8. What makes Merge Sort stable but Quick Sort not?
9. Write the Fibonacci DP solution (bottom-up) from memory.
10. Explain the Two Pointers pattern with one example.
