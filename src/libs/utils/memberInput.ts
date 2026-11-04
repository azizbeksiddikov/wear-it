/**
 * What a signed-in member may change about their own profile (`POST /member/update`).
 * Everything else in the request body is dropped: in particular `memberPoints`, `memberType`
 * and `memberStatus` (only the admin dashboard may set those), `_id` and the typo-ed
 * `memeberStatus`. Points are earned or topped up through their own routes.
 */
export const MEMBER_EDITABLE_FIELDS = [
	'memberEmail',
	'memberPhone',
	'memberPassword',
	'memberFullName',
	'memberAddress',
	'memberDesc',
	'memberImage',
] as const;

export type MemberEditableField = (typeof MEMBER_EDITABLE_FIELDS)[number];

/** These cannot be emptied: an empty value is ignored instead of saved. */
const REQUIRED_FIELDS: MemberEditableField[] = ['memberEmail', 'memberPhone', 'memberPassword'];

export const pickMemberUpdate = (input: unknown): Partial<Record<MemberEditableField, string>> => {
	const result: Partial<Record<MemberEditableField, string>> = {};
	if (!input || typeof input !== 'object') return result;

	for (const field of MEMBER_EDITABLE_FIELDS) {
		const value = (input as Record<string, unknown>)[field];
		if (typeof value !== 'string') continue;
		if (REQUIRED_FIELDS.includes(field) && value.trim() === '') continue;
		result[field] = value;
	}
	return result;
};
