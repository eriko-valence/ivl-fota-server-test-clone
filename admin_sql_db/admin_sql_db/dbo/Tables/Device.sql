CREATE TABLE [dbo].[Device] (
    [Id]                      BIGINT      NOT NULL,
    [DeviceGroupId]           INT         NULL,
    [ReportedFirmwareVersion] NCHAR (100) NULL,
    [LastReported]            DATETIME    NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Device_DeviceGroup] FOREIGN KEY ([DeviceGroupId]) REFERENCES [dbo].[DeviceGroup] ([Id])
);





