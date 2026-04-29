# Technique Detection Oracles

## Purpose

These tests are semantic oracles for the structural detector.

They are meant to block regressions where the detector:

- starts relying on names,
- confuses mutually exclusive recursion with branching recursion,
- overclassifies DP, greedy, or divide and conquer,
- or loses rename invariance.

## Current Oracle Set

- Recursive Binary Search -> `decrease_and_conquer`
- Recursive Ternary Search -> `decrease_and_conquer`
- Fibonacci -> `recursive_expansion`
- Hanoi -> `recursive_expansion`
- Generic k-way recursive split -> `divide_and_conquer`
- Prefix Sum must not be strong `dp_bottom_up`
- Counting Sort must not be strong `dp_bottom_up`
- Dutch Flag must not be strong `greedy`
- Rename invariance must hold for Divide and Conquer

## Acceptance Intent

The oracle suite validates structural semantics, not only runtime safety.

Passing means the detector is still aligned with the intended pedagogical interpretation of the AST.
