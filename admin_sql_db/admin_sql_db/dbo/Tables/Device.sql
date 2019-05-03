CREATE TABLE [dbo].[Device] (
    [Id]            BIGINT NOT NULL,
    [DeviceGroupId] INT    NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Device_DeviceGroup] FOREIGN KEY ([DeviceGroupId]) REFERENCES [dbo].[DeviceGroup] ([Id])
);

