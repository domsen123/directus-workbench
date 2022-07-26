import {
	InterfaceConfig,
	DisplayConfig,
	LayoutConfig,
	ModuleConfig,
	PanelConfig,
	HookConfig,
	EndpointConfig,
	OperationAppConfig,
	OperationApiConfig,
} from '../types';

export function defineInterface(config: InterfaceConfig): InterfaceConfig {
	return config;
}

export function defineDisplay(config: DisplayConfig): DisplayConfig {
	return config;
}

export function defineLayout<Options = any, Query = any>(
	config: LayoutConfig<Options, Query>
): LayoutConfig<Options, Query> {
	return config;
}

export function defineModule(config: ModuleConfig): ModuleConfig {
	return config;
}

export function definePanel(config: PanelConfig): PanelConfig {
	return config;
}

export function defineHook(config: HookConfig): HookConfig {
	return config;
}

export function defineEndpoint(config: EndpointConfig): EndpointConfig {
	return config;
}

export function defineOperationApp(config: OperationAppConfig): OperationAppConfig {
	return config;
}

export function defineOperationApi<Options = Record<string, unknown>>(
	config: OperationApiConfig<Options>
): OperationApiConfig<Options> {
	return config;
}
