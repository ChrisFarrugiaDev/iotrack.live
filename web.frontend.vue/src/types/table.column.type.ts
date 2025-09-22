export interface TableColumn {
	col: string;               
	data: string;               
	sort?: boolean;            
	hidden?: boolean;            
	searchable?: boolean;      
	width?: string;             
	align?: "left" | "center" | "right";
	format?: (value: any, row?: any) => string | number; 
	anchor?: {
		enabled: boolean;
		urlKey?: string;         
		target?: "_blank" | "_self";
	};
	className?: string;   
	
  to?: string | ((row: any) => string);                 // -> <RouterLink>
  onClick?: (row: any, value: any, ev: MouseEvent) => void; // plain click handler   
}