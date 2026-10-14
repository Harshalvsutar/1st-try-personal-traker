# Focus Bloom

Act as a senior mobile app developer. Build a personal productivity and study tracker mobile app using React Native (Expo) and NativeWind for styling. The app needs three main features, navigating via a bottom tab bar:

1. Focus Timer (Forest Style): Create a screen with a customizable Pomodoro countdown timer (default 25 minutes). While the timer runs, display an SVG or animation of a tree growing. If the user cancels the timer, the tree resets. When it finishes, log a 'successful session' to local state.

2. Daily Work Tracker (GitHub Heatmap): Create a dashboard screen that displays a multi-color contribution heatmap calendar (similar to GitHub's contribution graph). Use a library like react-native-calendar-heatmap. The grid boxes should change color intensity based on the number of focus sessions and study topics completed on that date.

3. Study & Problem Tracker: Create a daily log screen for study tracking. It must include:

A dynamic checklist (checkboxes) where I can add daily study topics.

Numeric text inputs (textboxes) specifically for logging 'Number of Questions Solved' today.

A 'Save Daily Record' button that stores this data.

Implement basic local storage using AsyncStorage to save the daily records, completed topics, and timer sessions so the heatmap accurately reflects historical data.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://growth-hatch-track.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ba2f845a-ddc3-56f2-8e1b-bac7c897635e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
