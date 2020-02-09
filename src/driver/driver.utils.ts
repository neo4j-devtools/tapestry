import _ from 'lodash';

import {IConnectionConfig, IDBMSMember, IDiscoveryTable, IRequestMeta} from '../types';
import {arrayHasItems} from '../utils/array.utils';
import Connection from '../connection/connection.class';
import {DBMS_DB_STATUS, DBMS_DB_ROLE} from './driver.constants';

export function getDiscoveryTableHostAndPort({address, name, role, currentStatus}: IDiscoveryTable): IDBMSMember {
    const [host, port = 80] = address.get().split(':');

    return {
        dbName: name.get(),
        host,
        role: role.get(),
        port: Number(port),
        currentStatus: currentStatus.get(),
        address: address.get()
    };
}

export function determineConnectionHosts(
    config: IConnectionConfig,
    tables: IDiscoveryTable[],
    connections: Connection[],
    meta?: IRequestMeta
): IDBMSMember[] {
    const desiredRole = meta && meta.role;
    const desiredDB = meta && meta.db;
    const desiredAddress = meta && meta.address;
    const {host, port} = config;
    const defaultHost: IDBMSMember = {
        dbName: desiredDB || 'default',
        host,
        port,
        address: `${host}:${port}`,
        currentStatus: DBMS_DB_STATUS.ONLINE,
        role: DBMS_DB_ROLE.LEADER
    };

    if (!arrayHasItems(tables)) {
        return [defaultHost];
    }

    const existingByHost = _.groupBy(connections, 'address');
    const availableHosts = _.map(tables, getDiscoveryTableHostAndPort);
    const withCorrectPrerequisites = _.filter(availableHosts, ({address, dbName, role}) => {
        if (desiredRole && desiredRole !== role) {
            return false;
        }

        if (desiredDB && desiredDB !== dbName) {
            return false;
        }

        if (desiredAddress && desiredAddress !== address) {
            return false;
        }

        return true;
    });
    const unassignedHosts = _.filter(withCorrectPrerequisites, ({address}) => !_.has(existingByHost, address));

    if (arrayHasItems(unassignedHosts)) {
        return unassignedHosts;
    }

    const byAmountOfConnections = _.sortBy(_.entries(existingByHost), ([, connections]) => connections.length);

    // @todo: massive cleanup
    return _.filter(availableHosts, ({address}) => {
        const hostAddress = _.head(_.head(byAmountOfConnections));

        return address === hostAddress;
    });
}
