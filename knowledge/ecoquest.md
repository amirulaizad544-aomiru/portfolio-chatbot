# EcoQuest

## Overview

EcoQuest is a Flutter/Dart educational application designed for primary school students and young learners to explore flora and fauna in outdoor environments.

The application combines education, AI, image recognition, augmented reality, gamification, and outdoor exploration.

## Target Users

The main target users are primary school students and young learners.

## Technologies

- Flutter
- Dart
- TensorFlow Lite
- Gemini API
- Supabase
- Google Sign-In
- AR

## AI Species Recognition

EcoQuest uses a TensorFlow Lite model for offline species recognition.

The model is stored locally in the application and can recognize supported species without requiring an internet connection.

The model uses:

- `species_model.tflite`
- `assets/models/labels.txt`

## Gemini AI

Gemini is used to provide learning-related AI functionality.

Examples include:
- Learning prompts
- Questions and answers
- Pre-capture learning hints
- Educational explanations

## Main Features

- Species recognition
- Offline recognition
- Learning quests
- Digital journal
- Species collection
- Reflection
- Sharing
- Species facts
- Location information
- Notes
- Quizzes
- XP
- Badges
- Daily activities
- Weekly activities
- Leaderboard
- QR functionality
- AR species information
- Tutorial system

## Data Synchronization

Supabase is used to synchronize application data and user-generated content.

The application also supports Google Sign-In.

## Educational Goals

EcoQuest supports:

- SDG 4: Quality Education
- SDG 15: Life on Land

The application aims to make outdoor learning more interactive by combining exploration with technology.

## Development Approach

The project follows Incremental Evolutionary Prototyping and uses the ADDIE instructional design model.

The application is evaluated through usability and functionality testing, including User Acceptance Testing (UAT).