const { withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/*
 * Opts react-native-firebase out of Swift Package Manager.
 *
 * Neither linkage mode works without this, which is why it exists rather than a
 * one-line `useFrameworks` setting:
 *
 *   static   react-native-firebase resolves firebase-ios-sdk through SPM, whose
 *            Swift Package ships only dynamic products. Every Firebase pod then
 *            embeds its own copy and the build dies on duplicate symbols.
 *            `pod install` refuses outright.
 *
 *   dynamic  Google's UserMessagingPlatform — pulled in by
 *            react-native-google-mobile-ads for the consent flow — ships a
 *            *static* xcframework, and CocoaPods will not put a static binary
 *            inside a dynamic-framework target. `pod install` refuses again.
 *
 * `$RNFirebaseDisableSPM` makes Firebase resolve through CocoaPods instead,
 * which is compatible with the static linkage the ads SDK needs. It is a
 * Podfile global, so it has to be written into the file itself — the Expo
 * plugin for react-native-firebase exposes no option for it.
 *
 * The variable must appear before any `target` block, so it is inserted after
 * the leading `require` lines rather than appended.
 */
const FLAG = '$RNFirebaseDisableSPM = true';

module.exports = function withRNFirebaseNoSPM(config) {
  return withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const podfile = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(FLAG)) return modConfig;

      const lines = contents.split('\n');
      // After the last require/require_relative at the top of the file, which is
      // where Podfile globals conventionally go and is guaranteed to precede
      // every target block.
      let insertAt = 0;
      for (let index = 0; index < lines.length; index += 1) {
        if (/^\s*require(_relative)?\s/.test(lines[index])) insertAt = index + 1;
        if (/^\s*target\s/.test(lines[index])) break;
      }

      lines.splice(
        insertAt,
        0,
        '',
        '# Resolve firebase-ios-sdk through CocoaPods rather than SPM. See',
        '# plugins/with-rnfirebase-no-spm.js for why neither linkage mode works',
        '# without this.',
        FLAG,
      );

      fs.writeFileSync(podfile, lines.join('\n'));
      return modConfig;
    },
  ]);
};
