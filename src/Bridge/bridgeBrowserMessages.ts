export const BrowserSetACLWhitelist = 'Browser.SetACLWhitelist';
export interface BrowserSetACLWhitelist {
	type: typeof BrowserSetACLWhitelist;
	acl: string[];
}

export const BrowserSetACLBlacklist = 'Browser.SetACLBlacklist';
export interface BrowserSetACLBlacklist {
	type: typeof BrowserSetACLBlacklist;
	acl: string[];
}

export const BrowserClearACL = 'Browser.ClearACL';
export interface BrowserClearACL {
	type: typeof BrowserClearACL;
}
