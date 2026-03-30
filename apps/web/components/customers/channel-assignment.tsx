import { CUSTOMER_CHANNELS } from "../../lib/customers";

type ChannelAssignmentProps = {
	defaultChannels?: string[];
	fieldName?: string;
};

export function ChannelAssignment({
	defaultChannels = CUSTOMER_CHANNELS as unknown as string[],
	fieldName = "activeChannels",
}: ChannelAssignmentProps) {
	return (
		<div className="field">
			<span className="field-label">Active channels</span>
			<div className="checkbox-grid">
				{CUSTOMER_CHANNELS.map((channel) => (
					<label className="checkbox-option" key={channel}>
						<input
							defaultChecked={defaultChannels.includes(channel)}
							name={fieldName}
							type="checkbox"
							value={channel}
						/>
						<span>{channel}</span>
					</label>
				))}
			</div>
		</div>
	);
}
