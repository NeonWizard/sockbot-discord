# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Changed shiritori chain breaking penalty from just `length` to `length * 10`

## [1.4.0] - 2022-10-03

### Added

- Added Guild database model for separating shiritori channels and lotteries between guilds
- Added check in shiritori channel for editing or deleting messages, which will incur a penalty and break the chain
- Added embed responses
  - Bank deposit/withdrawal
  - DoubleOrNothing winnings
  - Leaderboard command
  - Lottery ticket purchases (includes your newly purchased ticket numbers too!)
  - Payment command
  - Stats command

### Changed

- Generalized shiritori word storage, storing dictionary API results to reduce API calls
- Updated dependencies
- Changed "you can't afford that" messages to include more information, such as your current balance
- Changed shiritori chain broken response to an organized embed

### Fixed

- Fixed shiritori counting words that are part of a valid phrase as valid when not otherwise valid on their own
- Fixed possibility of getting duplicate numbers in lottery tickets
- Fixed lottery not actually paying users their winnings
- Temporary fix for bot going offline (discordjs internal websocket going zombie mode) by checking ping every so often. If it remains the same for an unusual period of time, the bot exits so it can restart

## [1.3.0] - 2022-09-23

### Added

- Added 'DEVELOPMENT' environment variable flag to disable shiritori rules for testing
- Added sock lottery system
- Added support for dynamic multiple digit point rewards for shiritori

### Changed

- Renamed listeners to modules and switched to dynamically importing them
- Passed bot instance to command execution to expose bot properties (such as logger)

### Fixed

- Fixed bot crashing any time logger.warn is called

## [1.2.2] - 2022-09-16

- Added debugging logs to diagnose problems with Discord API
- Added SHIRITORI_WORD_CHECK env flag for enabling shiritori dictionary checking

## [1.2.1] - 2022-09-11

### Fixed

- Fixed shiritori taking a large amount of time to process a word
- Fixed /leaderboard command pinging people T-T

## [1.2.0] - 2022-09-11

### Added

- Added a 4% daily compounding bank interest

### Changed

- Shiritori word uniqueness is now determined by the inflection root (for example, 'running' and 'run' are considered the same)
- Switched dictionary API from Merriam Webster to Oxford Dictionary

## [1.1.1] - 2022-09-10

### Changed

- Reduced unique shiritori word bonus from 50 points to 30 points

### Fixed

- Fixed unique shiritori word bonus always being applied
- Fixed /leaderboard not including bank balance

## [1.1.0] - 2022-09-09

### Added

- Added integration to dictionary API to check Shiritori word validity
- Added bot status to display current version it's running
- Added UserHistory table to record actions in shiritori, /pay, and /doubleornothing
- Added /leaderboard command
- Added /stats command
- Added 50 point reward for valid shiritori words that haven't been said before

### Changed

- Shiritori word must now be at least two letters

[unreleased]: https://github.com/NeonWizard/sockbot-discord/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/NeonWizard/sockbot-discord/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/NeonWizard/sockbot-discord/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/NeonWizard/sockbot-discord/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/NeonWizard/sockbot-discord/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/NeonWizard/sockbot-discord/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/NeonWizard/sockbot-discord/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/NeonWizard/sockbot-discord/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/NeonWizard/sockbot-discord/releases/tag/v1.0.0
