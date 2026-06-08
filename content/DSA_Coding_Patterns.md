# DSA Coding Patterns — Algorithm Templates
## Java Interview Coding Reference

> **How to use:** Read the "Recognize When" section, then study the template until you can write it from memory. Each pattern solves a whole family of problems.

---

## PATTERN 1 — Sliding Window

### Recognize When
- Contiguous subarray/substring problem
- "Maximum/minimum sum of K elements"
- "Longest substring with condition"
- Find subarray satisfying some constraint

### Fixed-Size Window Template
```java
// Example: Maximum sum of K consecutive lab values
int maxSumK(int[] values, int k) {
    int windowSum = 0;
    int maxSum = 0;

    // Build first window
    for (int i = 0; i < k; i++) {
        windowSum += values[i];
    }
    maxSum = windowSum;

    // Slide window: add right, remove left
    for (int i = k; i < values.length; i++) {
        windowSum += values[i];       // Add incoming element
        windowSum -= values[i - k];   // Remove outgoing element
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
```

### Variable-Size Window Template (Expand/Contract)
```java
// Example: Longest subarray with sum ≤ target
int longestSubarrayWithSumAtMost(int[] arr, int target) {
    int left = 0;
    int windowSum = 0;
    int maxLength = 0;

    for (int right = 0; right < arr.length; right++) {
        windowSum += arr[right];              // Expand window

        while (windowSum > target) {          // Shrink until valid
            windowSum -= arr[left];
            left++;
        }

        maxLength = Math.max(maxLength, right - left + 1);
    }
    return maxLength;
}

// Example: Longest substring with at most K distinct characters
int longestSubstringKDistinct(String s, int k) {
    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        freq.merge(c, 1, Integer::sum);       // freq[c]++

        while (freq.size() > k) {             // Too many distinct chars
            char leftChar = s.charAt(left);
            freq.merge(leftChar, -1, Integer::sum);
            if (freq.get(leftChar) == 0) freq.remove(leftChar);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

## PATTERN 2 — Two Pointers

### Recognize When
- Sorted array, find pair/triplet with sum
- "Move/partition elements"
- Compare from both ends (palindrome, container with most water)
- Merge sorted arrays

### Opposite Ends Template
```java
// Example: Two sum in sorted array
int[] twoSumSorted(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;    // Need bigger sum
        else right--;                      // Need smaller sum
    }
    return new int[]{-1, -1};
}

// Example: Valid palindrome (skip non-alphanumeric)
boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) return false;
        left++;
        right--;
    }
    return true;
}
```

### Same Direction (Fast/Slow) Template
```java
// Example: Remove duplicates from sorted array in-place
int removeDuplicates(int[] arr) {
    if (arr.length == 0) return 0;
    int slow = 0;                        // Points to last unique element

    for (int fast = 1; fast < arr.length; fast++) {
        if (arr[fast] != arr[slow]) {    // Found new unique
            slow++;
            arr[slow] = arr[fast];
        }
    }
    return slow + 1;                     // Length of deduplicated array
}

// Example: Linked list cycle detection (Floyd's)
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

---

## PATTERN 3 — Binary Search

### Recognize When
- Sorted array, find element or boundary
- "Find minimum/maximum that satisfies condition"
- Answer lies in a range, can binary search the answer

### Classic Binary Search
```java
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;    // Avoid overflow (not (l+r)/2)
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;  // Not found
}
```

### Find Leftmost (First Occurrence) Template
```java
// Returns index of first element == target, or -1
int findFirst(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;         // Record answer
            right = mid - 1;     // Keep searching LEFT
        } else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return result;
}
// Use same template for: first element >= target (change condition)
```

### Find Rightmost (Last Occurrence) Template
```java
int findLast(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            result = mid;         // Record answer
            left = mid + 1;      // Keep searching RIGHT
        } else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return result;
}
```

### Binary Search on Answer Template
```java
// "Find minimum X such that condition(X) is true"
// Works when: condition is monotonic (once true, stays true)
// Example: minimum days until all patients scheduled (Koko eating bananas variant)

int minimumCapacity(int[] requests, int days) {
    int left = 1;                                    // Min possible answer
    int right = Arrays.stream(requests).max().getAsInt();  // Max possible answer
    // OR: right = Arrays.stream(requests).sum(); if capacity could equal all

    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canFinish(requests, days, mid)) {        // Can we do it with capacity=mid?
            right = mid;                             // Try smaller (find minimum)
        } else {
            left = mid + 1;                          // Need more capacity
        }
    }
    return left;
}

boolean canFinish(int[] requests, int days, int capacity) {
    int daysNeeded = 1, current = 0;
    for (int r : requests) {
        if (current + r > capacity) { daysNeeded++; current = 0; }
        current += r;
    }
    return daysNeeded <= days;
}
```

---

## PATTERN 4 — BFS (Breadth-First Search)

### Recognize When
- Shortest path in unweighted graph
- Level-order traversal
- "Minimum steps/hops to reach"
- "Spread from source" (infection, broadcast)

### BFS Template
```java
// Graph BFS — shortest path from start to end
int shortestPath(Map<Integer, List<Integer>> graph, int start, int end) {
    Queue<Integer> queue = new LinkedList<>();
    Set<Integer> visited = new HashSet<>();

    queue.offer(start);
    visited.add(start);
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();           // Process level by level

        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            if (node == end) return steps;

            for (int neighbor : graph.getOrDefault(node, List.of())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        steps++;                           // Increment after each level
    }
    return -1;  // Not reachable
}

// Binary tree level-order traversal
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();

        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

---

## PATTERN 5 — DFS (Depth-First Search)

### Recognize When
- Explore all paths
- Detect cycles
- Connected components
- Topological sort
- Tree problems (any traversal)

### Iterative DFS Template
```java
void dfs(Map<Integer, List<Integer>> graph, int start) {
    Deque<Integer> stack = new ArrayDeque<>();
    Set<Integer> visited = new HashSet<>();

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);

        // Process node
        System.out.println(node);

        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                stack.push(neighbor);
            }
        }
    }
}
```

### Recursive DFS Template
```java
void dfsRecursive(int node, Map<Integer, List<Integer>> graph,
                  Set<Integer> visited) {
    visited.add(node);

    // Process node (pre-order)
    System.out.println(node);

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            dfsRecursive(neighbor, graph, visited);
        }
    }

    // Post-order processing here (after all children)
}

// Count connected components
int countComponents(int n, int[][] edges) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    for (int[] e : edges) {
        graph.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
        graph.computeIfAbsent(e[1], k -> new ArrayList<>()).add(e[0]);
    }

    Set<Integer> visited = new HashSet<>();
    int components = 0;
    for (int i = 0; i < n; i++) {
        if (!visited.contains(i)) {
            dfsRecursive(i, graph, visited);
            components++;
        }
    }
    return components;
}
```

---

## PATTERN 6 — Dynamic Programming

### Recognize When
- "Optimal" (min/max/count) answer
- Overlapping subproblems
- Choices at each step affect future choices
- "Number of ways to..."
- "Can you achieve X?"

### Top-Down (Memoization) Template
```java
// Example: Maximum non-overlapping appointments (like house robber)
// dp[i] = max appointments considering first i

Map<Integer, Integer> memo = new HashMap<>();

int maxAppointments(int[] durations) {
    return solve(durations, 0);
}

int solve(int[] dur, int i) {
    if (i >= dur.length) return 0;
    if (memo.containsKey(i)) return memo.get(i);

    // Choice 1: Skip appointment i
    int skip = solve(dur, i + 1);

    // Choice 2: Take appointment i, skip next overlapping
    int take = dur[i] + solve(dur, i + 2);  // Skip adjacent

    int result = Math.max(skip, take);
    memo.put(i, result);
    return result;
}
```

### Bottom-Up (Tabulation) Template
```java
// Same problem, iterative — more space efficient
int maxAppointmentsDP(int[] values) {
    int n = values.length;
    if (n == 0) return 0;
    if (n == 1) return values[0];

    int[] dp = new int[n];
    dp[0] = values[0];
    dp[1] = Math.max(values[0], values[1]);

    for (int i = 2; i < n; i++) {
        dp[i] = Math.max(
            dp[i - 1],              // Skip current
            dp[i - 2] + values[i]   // Take current
        );
    }
    return dp[n - 1];
}

// Space-optimized (only need last 2):
int maxAppointmentsOpt(int[] values) {
    int prev2 = 0, prev1 = 0;
    for (int v : values) {
        int curr = Math.max(prev1, prev2 + v);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

### 2D DP Template (Grid/Matrix)
```java
// Example: Minimum path sum from top-left to bottom-right
int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dp = new int[m][n];

    dp[0][0] = grid[0][0];

    // Fill first row
    for (int j = 1; j < n; j++) dp[0][j] = dp[0][j-1] + grid[0][j];

    // Fill first column
    for (int i = 1; i < m; i++) dp[i][0] = dp[i-1][0] + grid[i][0];

    // Fill rest
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = grid[i][j] + Math.min(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m-1][n-1];
}
```

### Knapsack Template (0/1)
```java
// Example: Can we schedule appointments to exactly fill T hours?
boolean canFillExactly(int[] durations, int T) {
    boolean[] dp = new boolean[T + 1];
    dp[0] = true;  // 0 hours is always achievable

    for (int d : durations) {
        // Traverse backwards to avoid using same item twice
        for (int j = T; j >= d; j--) {
            dp[j] = dp[j] || dp[j - d];
        }
    }
    return dp[T];
}
```

---

## PATTERN 7 — Backtracking

### Recognize When
- "Generate all combinations/permutations/subsets"
- "Find all paths"
- Constraint satisfaction (Sudoku, N-Queens)

### Backtracking Template
```java
// Example: All combinations of K conditions from a list
List<List<String>> combinationK(List<String> conditions, int k) {
    List<List<String>> result = new ArrayList<>();
    backtrack(conditions, k, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(List<String> conditions, int k, int start,
               List<String> current, List<List<String>> result) {
    if (current.size() == k) {
        result.add(new ArrayList<>(current));  // Add COPY (not reference)
        return;
    }

    for (int i = start; i < conditions.size(); i++) {
        current.add(conditions.get(i));           // Choose
        backtrack(conditions, k, i + 1, current, result);  // Explore
        current.remove(current.size() - 1);       // Unchoose (backtrack)
    }
}

// Example: All subsets (power set)
List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, int start, List<Integer> current,
               List<List<Integer>> result) {
    result.add(new ArrayList<>(current));   // Add current subset (including empty)

    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);
        backtrack(nums, i + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

---

## PATTERN 8 — Merge Intervals

### Recognize When
- "Merge overlapping intervals"
- "Meeting rooms" (count concurrent intervals)
- Scheduling problems
- Insert interval into sorted list

### Merge Overlapping Intervals Template
```java
// [[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]
int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);  // Sort by start time
    List<int[]> result = new ArrayList<>();

    for (int[] interval : intervals) {
        if (result.isEmpty() || result.getLast()[1] < interval[0]) {
            result.add(interval);           // No overlap — add new interval
        } else {
            // Overlap — merge: extend end if needed
            result.getLast()[1] = Math.max(result.getLast()[1], interval[1]);
        }
    }
    return result.toArray(new int[0][]);
}

// Count minimum rooms needed for overlapping appointments
int minMeetingRooms(int[][] intervals) {
    int[] starts = new int[intervals.length];
    int[] ends = new int[intervals.length];
    for (int i = 0; i < intervals.length; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, endPtr = 0;
    for (int start : starts) {
        if (start < ends[endPtr]) rooms++;    // Need new room
        else endPtr++;                         // Reuse room (appointment ended)
    }
    return rooms;
}
```

---

## PATTERN 9 — Monotonic Stack

### Recognize When
- "Next greater/smaller element"
- "Largest rectangle in histogram"
- "Daily temperatures" (days until warmer)
- Problems where you need to find nearest element satisfying condition

### Next Greater Element Template
```java
// For each element, find the next greater element to its right
int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);            // Default: no greater element
    Deque<Integer> stack = new ArrayDeque<>();  // Stack of indices

    for (int i = 0; i < n; i++) {
        // Pop elements whose next greater is arr[i]
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }
    return result;
}

// Daily temperatures variant
int[] dailyTemperatures(int[] temps) {
    int[] result = new int[temps.length];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < temps.length; i++) {
        while (!stack.isEmpty() && temps[stack.peek()] < temps[i]) {
            int idx = stack.pop();
            result[idx] = i - idx;   // Days to wait
        }
        stack.push(i);
    }
    return result;
}
```

---

## PATTERN 10 — Heap / Priority Queue

### Recognize When
- "K largest/smallest elements"
- "Merge K sorted lists"
- "Top K frequent elements"
- Always need access to min or max

### K Largest Elements Template
```java
// Return K largest — use MIN-heap of size K
// When heap size > K, poll (removes smallest) → heap always has K largest
int[] kLargest(int[] arr, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    for (int num : arr) {
        minHeap.offer(num);
        if (minHeap.size() > k) minHeap.poll();  // Remove smallest
    }

    return minHeap.stream().mapToInt(Integer::intValue).toArray();
}

// K-th largest: return minHeap.peek() after the loop

// Top K frequent elements
List<Integer> topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    // Min-heap by frequency
    PriorityQueue<Integer> heap = new PriorityQueue<>(
        Comparator.comparingInt(freq::get));

    for (int num : freq.keySet()) {
        heap.offer(num);
        if (heap.size() > k) heap.poll();
    }

    return new ArrayList<>(heap);
}
```

### Merge K Sorted Arrays Template
```java
int[] mergeKSorted(int[][] arrays) {
    // Min-heap: [value, arrayIndex, elementIndex]
    PriorityQueue<int[]> heap = new PriorityQueue<>(
        Comparator.comparingInt(a -> a[0]));

    int totalSize = 0;
    for (int i = 0; i < arrays.length; i++) {
        if (arrays[i].length > 0) {
            heap.offer(new int[]{arrays[i][0], i, 0});
            totalSize += arrays[i].length;
        }
    }

    int[] result = new int[totalSize];
    int idx = 0;

    while (!heap.isEmpty()) {
        int[] curr = heap.poll();
        result[idx++] = curr[0];
        int arrayIdx = curr[1], elementIdx = curr[2];

        if (elementIdx + 1 < arrays[arrayIdx].length) {
            heap.offer(new int[]{
                arrays[arrayIdx][elementIdx + 1],
                arrayIdx,
                elementIdx + 1
            });
        }
    }
    return result;
}
```

---

## PATTERN 11 — Tree Traversals

### All Traversals Template
```java
// Pre-order: root → left → right (useful: copy tree, serialize)
void preOrder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    result.add(root.val);          // Visit BEFORE children
    preOrder(root.left, result);
    preOrder(root.right, result);
}

// In-order: left → root → right (useful: BST gives sorted order!)
void inOrder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    inOrder(root.left, result);
    result.add(root.val);          // Visit BETWEEN children
    inOrder(root.right, result);
}

// Post-order: left → right → root (useful: delete tree, evaluate expression)
void postOrder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    postOrder(root.left, result);
    postOrder(root.right, result);
    result.add(root.val);          // Visit AFTER children
}

// Iterative in-order (common interview ask)
List<Integer> inOrderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {        // Go left as far as possible
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();           // Process node
        result.add(curr.val);
        curr = curr.right;            // Move to right subtree
    }
    return result;
}
```

### Common Tree Problems
```java
// Height of tree
int height(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(height(root.left), height(root.right));
}

// Lowest Common Ancestor
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lca(root.left, p, q);
    TreeNode right = lca(root.right, p, q);
    return (left != null && right != null) ? root : (left != null ? left : right);
}

// Validate BST
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
```

---

## PATTERN 12 — HashMap Patterns

### Frequency Count Template
```java
// Frequency of each element
Map<Integer, Integer> freq = new HashMap<>();
for (int num : arr) {
    freq.merge(num, 1, Integer::sum);  // freq[num]++ (handles missing key)
}

// Or: freq.put(num, freq.getOrDefault(num, 0) + 1);
```

### Prefix Sum + HashMap Template
```java
// Count subarrays with sum == k
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty subarray has sum 0

    int count = 0, prefixSum = 0;
    for (int num : nums) {
        prefixSum += num;
        // If (prefixSum - k) was seen before, there's a subarray summing to k
        count += prefixCount.getOrDefault(prefixSum - k, 0);
        prefixCount.merge(prefixSum, 1, Integer::sum);
    }
    return count;
}
```

### Two Sum Template
```java
// Classic: find two indices where arr[i] + arr[j] == target
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();  // value → index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(nums[i], i);
    }
    return new int[]{};
}
```

---

## PATTERN RECOGNITION CHEAT SHEET

```
"Subarray/substring with condition"     → Sliding Window
"Sorted array, find pair/sum"           → Two Pointers
"Search in sorted array"                → Binary Search
"Minimum steps to reach"                → BFS
"All paths / detect cycle"              → DFS
"Max/min profit, optimal choices"       → DP
"Generate all combinations"             → Backtracking
"Overlapping intervals"                 → Merge Intervals / Sort
"Next greater/smaller element"          → Monotonic Stack
"K largest/smallest / top K"            → Heap (PriorityQueue)
"Level-order tree traversal"            → BFS
"Subtree problems"                      → DFS on tree (recursive)
"Anagram / character count"             → HashMap / Sliding Window
"Subarray sum == k"                     → Prefix Sum + HashMap
"Sorted array + complement"             → Two Pointers or Binary Search
```

---

## COMMON TRICKS TO REMEMBER

```java
// Avoid integer overflow in binary search midpoint
int mid = left + (right - left) / 2;    // CORRECT
int mid = (left + right) / 2;           // WRONG (overflow if both large)

// Max-heap (Java PriorityQueue is min-heap by default)
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Sort 2D array by first column
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

// Collections.sort vs Arrays.sort
// Both O(n log n); Arrays.sort for primitives uses Dual-Pivot QuickSort
// Collections.sort (and Arrays.sort for objects) uses TimSort (stable)

// Add to map safely (no NPE)
map.merge(key, 1, Integer::sum);                    // Increment
map.computeIfAbsent(key, k -> new ArrayList<>()).add(value);  // Group

// StringBuilder for string building in loops
StringBuilder sb = new StringBuilder();
for (String s : list) sb.append(s).append(",");
String result = sb.toString();

// Integer.MAX_VALUE / MIN_VALUE
int max = Integer.MAX_VALUE;    // 2^31 - 1 = 2,147,483,647
int min = Integer.MIN_VALUE;    // -2^31 = -2,147,483,648
// Use Long.MIN/MAX_VALUE when int might overflow

// Check if character is alphanumeric
Character.isLetterOrDigit(c)
Character.toLowerCase(c)
c - 'a'  // Convert char to 0-25 index (only lowercase)

// Convert int array to list
List<Integer> list = Arrays.stream(arr).boxed().collect(Collectors.toList());

// Convert list to int array
int[] arr = list.stream().mapToInt(Integer::intValue).toArray();
```
