/*
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

Ext.define('Arches.models.ClusterMember', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'entityTypeId', mapping: 'entitytypeid', type: 'string'},
        {name: 'entityId', mapping: 'entityid', type: 'string'},
        {name: 'primaryname', mapping: 'primaryname', type: 'string'},
        {name: 'geometry', mapping: 'geometry'}
    ]
});