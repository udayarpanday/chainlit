// Keep these identifiers aligned with the internal Privacy Shield agent prompt.
// They form replacement tokens; translate their labels, not their values.
export const privacySectionTypes = [
  'name',
  'organization',
  'email',
  'phone',
  'location',
  'birthdate',
  'id_number',
  'financial',
  'online_id',
  'credential',
  'other'
] as const;

export const getPrivacyCategoryLabel = (
  type: string,
  t: (key: string, options: { defaultValue: string }) => string
) =>
  t(
    `components.organisms.privacyShield.createSection.typefield.options.${type}`,
    { defaultValue: type }
  );
