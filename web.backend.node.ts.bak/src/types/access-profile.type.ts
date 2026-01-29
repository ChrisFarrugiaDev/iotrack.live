import { AssetType } from "../models/asset.model";
import { DeviceType } from "../models/device.model";
import { OrganisationType } from "../models/organisation.model";

export interface AccessProfile {
	first_name: string;
	last_name: string;
	email: string;
	role: { id: number; name: string };
	organisation: { id: string; path: string; uuid: string; name: string };
	organisation_scope: Record<string, Partial<OrganisationType>>;

	authorization: {
		roles: Record<string, any>;
		permissoins: Record<string, any>;
		role_permissions: Record<string, any>;
	}
	access: {
		assets: Record<string, AssetType>;
		devices: Record<string, DeviceType>;
		settings: Record<string, any>;
		permissions: Record<string, any>;
	}
} 