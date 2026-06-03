// var threeSum = function (nums) {
//     let newNum = []
//     const len = nums.length
//     if (nums === null || len < 3) return newNum
//     nums.sort((a, b) => a - b)
//     for (let i = 0; i < len; i++) {
//         if (nums[i] > 0) break;
//         if (i > 0 && nums[i] === nums[i - 1]) continue
//         let L = i + 1;
//         let R = len - 1
//         while (L < R) {
//             const sum = nums[i] + nums[L] + nums[R]
//             if (sum === 0) {
//                 newNum.push([nums[i], nums[L], nums[R]])
//                 while (L < R && nums[L] === nums[L + 1]) L++
//                 while (L < R && nums[R] === nums[R - 1]) R--
//                 L++;
//                 R--
//             }
//             else if (sum > 0) R--
//             else if (sum < 0) L++
//         }
//     }
//     return newNum
// };

// var trap = function (height) {
//     const n = height.length;
//     if (n === 0) {
//         return 0;
//     }
//     const leftMax = new Array(n).fill(0)
//     for (let i = 0; i < n; ++i) {
//         leftMax[i] = Math.max(leftMax[i - 1], height[i])
//     }
//     const rightMax = new Array(n).fill(0)
//     rightMax[n - 1] = height[n - 1]
//     for (let i = n - 2; i > 0; --i) {
//         rightMax[i] = Math.max(rightMax[i + 1], height[i])
//     }
//     let ans = 0;
//     for (let i = 0; i < n; i++) {
//         ans += Math.min(leftMax[i], rightMax[i]) - height[i]
//     }
//     return ans
// };

// var findAnagrams = function (s, p) {
//     const n = s.length
//     let list = []
//     if (n === 0) return list
//     const ooc = new Set()
//     let rk = -1
//     for (let k = 0; k < p.length; k++) {
//         ooc.add(p.)
//     }
//     for (let i = 0; i < n; i++) {

//     }
// };

// var subarraySum = function (nums, k) {
//     const len = nums.length
//     let sum = 0
//     for (let i = 0; i < len; i++) {
//         let j = i + 1
//         let count = nums[i]
//         if (nums[i] === k) {
//             sum++
//         }
//         while (j < len) {
//             count += nums[j]
//             if (count === k) {
//                 sum++
//                 break;
//             }
//             j++
//         }
//     }
//     return sum
// };

// function maxNum(nums) {
//     const n = nums.length
//     let max = nums[0]
//     for (let i = 1; i < n; i++) {
//         if (nums[i] > max) max = nums[i]
//     }
// }
// var maxSlidingWindow = function (nums, k) {
//     const len = nums.length
//     let arr = []
//     for (let i = 0; i < len - k; i++) {
//         let j = i + 1
//         let max = nums[i]
//         while (j < i + k) {
//             if (nums[j] > max) max = nums[j]
//         }
//         arr.append(max)
//     }
//     return arr
// };

var maxSlidingWindow = function (nums, k) {
    const deque = []
    const res = []
    for (let i = 0; i < nums.length; i++) {
        if (deque.length && deque[0] <= i - k) {
            deque.shift()
        }

    }
}