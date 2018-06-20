import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@material-ui/core'

class DeleteTorrentDialog extends Component {
    constructor(props, context) {
        super(props, context)
    }

    render() {
        const { torrent, onAccept, onReject } = this.props

        return (
            <Dialog open={torrent != null} onClose={onReject}>
                <DialogTitle>Delete torrent?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do you want to delete torrent {torrent && torrent.name} and all data?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onReject} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => onAccept(torrent)} color="secondary" variant="raised" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

DeleteTorrentDialog.propTypes = {
    torrent: PropTypes.object,
    onAccept: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
}

export default DeleteTorrentDialog