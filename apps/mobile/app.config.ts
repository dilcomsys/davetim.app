import { existsSync } from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/*
 * The SKAdNetwork identifiers AdMob asks every publisher to declare, from
 * Google's iOS quick-start ("Update your Info.plist"). Without them iOS sends
 * no install postback for those buyers, so campaigns cannot attribute installs
 * and the inventory is worth measurably less. Ads still serve either way, which
 * is why the gap is easy to ship and hard to notice.
 *
 * Kept inline: Expo loads this file on its own, outside the app's module graph,
 * so an import from `src/` fails to resolve and breaks every build.
 *
 * Google adds buyers over time. Re-copy before a release from
 * https://developers.google.com/admob/ios/quick-start
 */
const SKADNETWORK_IDS = [
  'cstr6suwn9', '4fzdc2evr5', '2fnua5tdw4', 'ydx93a7ass', 'p78axxw29g', 'v72qych5uu',
  'ludvb6z3bs', 'cp8zw746q7', '3sh42y64q3', 'c6k4g5qg8m', 's39g8k73mm', 'wg4vff78zm',
  '3qy4746246', 'f38h382jlk', 'hs6bdukanm', 'mlmmfzh3r3', 'v4nxqhlyqp', 'wzmmz9fp6w',
  'su67r6k2v3', 'yclnxrl5pm', 't38b2kh725', '7ug5zh24hu', 'gta9lk7p23', 'vutu7akeur',
  'y5ghdn5j9k', 'v9wttpbfk9', 'n38lu8286q', '47vhws6wlr', 'kbd757ywx3', '9t245vhmpl',
  'a2p9lx4jpn', '22mmun2rn5', '44jx6755aq', 'k674qkevps', '4468km3ulz', '2u9pt9hc89',
  '8s468mfl3y', 'klf5c3l5u5', 'ppxm28t8ap', 'kbmxgpxpgc', 'uw77j35x4d', '578prtvx9j',
  '4dzt52r2t5', 'tl55sbb4fm', 'c3frkrj4fj', 'e5fvkxwrpn', '8c4e2ghe7u', '3rd42ekr43',
  '97r2b46745', '3qcr597p9d',
].map((id) => `${id}.skadnetwork`);

const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

/*
 * Firebase Analytics is wired only when its service files are actually present.
 *
 * `@react-native-firebase/app` fails the native build outright if the plugin is
 * declared without `GoogleService-Info.plist` / `google-services.json`, and
 * those files carry project identifiers that do not belong in the repository —
 * they are downloaded per environment from the Firebase console. Declaring the
 * plugin conditionally keeps `npx expo start` and the web export working for
 * anyone who has not fetched them yet, and the analytics gateway already
 * degrades to a no-op when the native module is missing, so the app behaves
 * correctly either way.
 *
 * The warning is loud rather than silent: shipping a release with no analytics
 * because a file was missing is exactly the kind of thing nobody notices until
 * the dashboards stay empty.
 */
const IOS_SERVICE_FILE = './GoogleService-Info.plist';
const ANDROID_SERVICE_FILE = './google-services.json';

function firebaseServiceFiles(projectRoot: string) {
  const ios = existsSync(path.join(projectRoot, IOS_SERVICE_FILE));
  const android = existsSync(path.join(projectRoot, ANDROID_SERVICE_FILE));
  return { android, any: ios || android, ios };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const adsEnabled = process.env.EXPO_PUBLIC_ENABLE_REWARDED_ADS === 'true';
  const androidAppId = process.env.ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.ADMOB_IOS_APP_ID;
  if (adsEnabled && (!androidAppId || !iosAppId)) {
    throw new Error('Ödüllü reklamlar açıkken ADMOB_ANDROID_APP_ID ve ADMOB_IOS_APP_ID zorunludur.');
  }

  /*
   * The native App IDs failed the build when they were missing, but the rewarded
   * *unit* IDs did not — they were only read at the moment someone tapped "watch
   * an ad", so a release built without them looked healthy and then told the
   * user the reward was unconfigured. Both halves of the configuration now fail
   * in the same place, at build time. Development builds keep using Google's
   * test unit, so this only binds release configuration.
   */
  if (adsEnabled && (!process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID || !process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID)) {
    throw new Error(
      'Ödüllü reklamlar açıkken EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_UNIT_ID ve '
      + 'EXPO_PUBLIC_ADMOB_REWARDED_IOS_UNIT_ID zorunludur.',
    );
  }

  const firebase = firebaseServiceFiles(__dirname);
  if (!firebase.any) {
    console.warn(
      '[davetim] Firebase service files not found — analytics will be a no-op in this build.\n'
      + `          Download ${IOS_SERVICE_FILE} and ${ANDROID_SERVICE_FILE} from the Firebase console\n`
      + '          into apps/mobile/ before cutting a release.',
    );
  }

  return {
    ...config,
    name: config.name ?? 'Davetim',
    slug: config.slug ?? 'davetim',
    ...(firebase.ios ? { ios: { ...config.ios, googleServicesFile: IOS_SERVICE_FILE } } : {}),
    ...(firebase.android ? { android: { ...config.android, googleServicesFile: ANDROID_SERVICE_FILE } } : {}),
    plugins: [
      ...(config.plugins ?? []),
      /*
       * Firebase pods are static libraries, and CocoaPods needs to be told so
       * once for the whole target. Without this the iOS build fails on the
       * first Firebase pod with a non-modular-header error that reads as
       * unrelated to Firebase.
       */
      ...(firebase.any
        ? [
          '@react-native-firebase/app',
          /*
           * Static linkage plus an SPM opt-out. Both halves are required and
           * neither is optional — see plugins/with-rnfirebase-no-spm.js for the
           * two `pod install` failures that pin this down.
           */
          './plugins/with-rnfirebase-no-spm.js',
          ['expo-build-properties', { ios: { useFrameworks: 'static' } }] as [string, Record<string, unknown>],
        ]
        : []),
      ['react-native-google-mobile-ads', {
        androidAppId: androidAppId ?? TEST_ANDROID_APP_ID,
        delayAppMeasurementInit: true,
        iosAppId: iosAppId ?? TEST_IOS_APP_ID,
        /*
         * No `userTrackingUsageDescription`, deliberately. The gateway requests
         * `requestNonPersonalizedAdsOnly`, so the app never asks for the IDFA
         * and must not ship an ATT prompt it would never show — a declared
         * tracking purpose with no tracking is a review question with no good
         * answer. SKAdNetwork attribution does not need ATT.
         */
        skAdNetworkItems: SKADNETWORK_IDS,
      }],
    ],
  };
};
